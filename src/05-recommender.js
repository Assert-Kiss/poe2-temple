    function stateGapToTarget(target) {
      const spec = target.layoutSpec;
      const gaps = [];
      for (const want of spec) {
        const tile = tileAt({ row: want.row, col: want.col });
        if (!tile) continue;
        const isFoyer = isFoyerTile({ row: want.row, col: want.col });
        if (isFoyer) continue;  // foyer 我们不管
        // 检查内容
        const contentOk = (tile.destroyed ? "empty" : tile.content) === want.content;
        // 修复 #98 P1:tier 改成 have >= want。autoUpgradeAll 会把 shell T1 升 T2/T3 — "超过目标 tier" 是好事不是缺口,
        // 否则刚载入 Plan A progress 只 63%,推荐器会错误追求降级/重建。
        const wantTier = want.tier ?? tile.tier;
        const tierOk = tile.tier >= wantTier;
        // medallion 视为字符串或 null;false/undefined 都当 null
        const wantMed = want.medallion || null;
        const haveMed = tile.medallion || null;
        const medOk = wantMed === haveMed;
        const lockOk = !!(want.rewardLocked) === !!tile.rewardLocked;
        if (!contentOk) {
          gaps.push({ pos: { row: want.row, col: want.col }, missing: "content", want: want.content, have: tile.destroyed ? "destroyed" : tile.content });
        } else if (!tierOk) {
          gaps.push({ pos: { row: want.row, col: want.col }, missing: "tier", want: want.tier, have: tile.tier });
        } else if (!medOk) {
          gaps.push({ pos: { row: want.row, col: want.col }, missing: "medallion", want: want.medallion, have: tile.medallion });
        } else if (!lockOk) {
          gaps.push({ pos: { row: want.row, col: want.col }, missing: "rewardLock", want: !!want.rewardLocked, have: !!tile.rewardLocked });
        }
      }
      const totalSpec = spec.filter(s => !isFoyerTile({row:s.row, col:s.col})).length;
      const matchedSpec = totalSpec - gaps.length;
      const progress = totalSpec ? Math.round(matchedSpec / totalSpec * 100) : 100;
      // milestone 进度
      const milestones = (target.milestones || []).map(m => ({
        id: m.id,
        label: m.label,
        done: !!m.check()
      }));
      return { gaps, totalSpec, matchedSpec, progress, milestones };
    }

    // 给定 target,生成「应该打」的动作。
    // 关键原则:**从入口渐进式铺设** + **环上补回优先** —
    //   1. 邻接可达的格子优先(buildable)— +150 加成,从 foyer 一步步扩出去
    //   2. 远离可达的格子放后面(unbuildable)— 当前打不通,只能等链扩到那
    //   3. 路径卡可以铺**非 target 格子**作为基础设施(扩通 + 留位置)
    //   4. **环成员加成**:如果 target spec 在某位置形成闭环,补回该空位 = 闭环修复 → 极高优先
    function recommendForGoal(target, ruleSet = el("ruleSet").value) {
      const gap = stateGapToTarget(target);
      const reachable = reachableFromFoyer();
      const actions = [];
      const repair = computeRepairState();

      function isAdjReach(pos) {
        return adjacentInBounds(pos).some(p => reachable.has(tileKey(p)));
      }
      function distFromFoyer(pos) {
        return Math.abs(pos.row - FOYER_TILE.row) + Math.abs(pos.col - FOYER_TILE.col);
      }
      // 用户决策(2026-05-19,round p 后):**不主动向 atziri 推进**。
      //   策略目标 = 可循环往复刷神庙(每次 close 10% 塌陷,长期稳态密度填充)。
      //   打 atziri 一次性大塌陷神庙(wiki L186:"After Atziri, many non-Path rooms, Royal Access Chamber, and most Path rooms will be removed")
      //   → 反进度。所以 distFromFoyer 保留,**近 foyer 紧凑密铺优先**,col 4 主链推进 (0,4) 自然延后。
      // 检测某位置是否是 target spec 里的「环成员」 —
      // 简化判定:若该位置在 target 中,且 target 拓扑(根据 spec)在这个位置形成回路(邻居 ≥ 2 个也在 spec 内),
      // 则认为是环成员。补回环成员 = 闭环修复 → 加 +30 分。
      const targetPosSet = new Set(target.layoutSpec.map(e => `${e.row},${e.col}`));
      function isRingMember(pos) {
        if (!targetPosSet.has(`${pos.row},${pos.col}`)) return false;
        let specNeighbors = 0;
        for (const next of adjacentInBounds(pos)) {
          if (targetPosSet.has(`${next.row},${next.col}`)) specNeighbors++;
        }
        return specNeighbors >= 2;  // 至少 2 个 spec 邻居 → 在环 / 多链上
      }
      // 评分(2026-05-19,round p 用户决策):**循环往复神庙策略**
      //   distFromFoyer 评分 → 近 foyer 紧凑密铺,**不主动通向 atziri**
      //   buildable(邻接可达):200 - dist
      //   unbuildable(不连通):-1000 - dist · 强惩罚永不为 top-1(避免推孤立放置浪费手牌)
      //   ring 成员补回:+30
      function placeValue(pos) {
        const adjReach = isAdjReach(pos);
        const ring = isRingMember(pos);
        const d = distFromFoyer(pos);
        let v = adjReach ? (200 - d) : (-1000 - d);
        if (ring) v += 30;
        return { value: v, adjReach, ring };
      }

      // 把卡 id 转成中文名(显示用)
      const cardLabel = (id) => (id === "path" ? "通路" : (ROOM_TYPES[id]?.label ?? id));

      function canPlayCardAt(handIdx, cardId, pos) {
        const tile = tileAt(pos);
        if (!tile || (!tile.destroyed && tile.content !== "empty")) return false;
        if (cardId !== "path") {
          const verdict = canPlaceRoom(pos, cardId);
          if (!verdict.ok) return false;
        }
        return handIdx >= 0;
      }

      function repairActionTitle(cardId, pos, scored) {
        return `${cardId === "path" ? "抢修铺通路" : `抢修打 ${cardLabel(cardId)}`} → ${pos.row},${pos.col}(解除 ${scored.relieved} 个唯一桥 · 降低低谷损失 ${scored.preventedLoss})`;
      }

      // 0) 抢修 FSM 优先:如果当前手牌能补推荐闭环/支链,先插入正式动作队列。
      // 这样战前目标推荐、长期 projection、自播放都会和实战面板使用同一套自愈优先级。
      for (const scored of repair.placements.slice(0, 4)) {
        if (scored.score <= 0) continue;
        for (let handIdx = 0; handIdx < state.hand.length; handIdx++) {
          const cardId = state.hand[handIdx];
          if (!cardId) continue;
          if (!canPlayCardAt(handIdx, cardId, scored.pos)) continue;
          const isPath = cardId === "path";
          actions.push({
            type: "play-card",
            handIdx, cardId,
            pos: { ...scored.pos },
            title: repairActionTitle(cardId, scored.pos, scored),
            repair: true,
            repairScore: scored,
            // 抢修是控制动作,必须压过普通 spec match / fallback,但仍保留评分差异。
            gapValue: 1000 + scored.score + (isPath ? 25 : 0)
          });
          break;
        }
      }

      // 检测放下此卡是否会触发邻居被动升级(wiki line 1036:互动家族房放置触发升级)
      // 返回触发说明字符串(如 "触发驻军地 T1→T2"),没触发就返回 null
      function detectCascadeTrigger(pos, cardId) {
        const triggers = [];
        for (const nbPos of adjacentInBounds(pos)) {
          const nbTile = tileAt(nbPos);
          if (!nbTile || nbTile.destroyed) continue;
          if (nbTile.content === "empty" || nbTile.content === "path") continue;
          const nbMeta = ROOM_TYPES[nbTile.content];
          if (!nbMeta?.upgradeAdjacency) continue;
          const nextTier = (nbTile.tier ?? 0) + 1;
          const rule = nbMeta.upgradeAdjacency[String(nextTier)];
          if (!rule) continue;
          // 简化检测:卡 id 在升级源列表里就标记;不严格算 count / requireAll(实际触发还要满足全条件,但这给玩家一个提示)
          const rooms = Array.isArray(rule) ? rule : (rule.rooms || []);
          if (rooms.includes(cardId)) {
            triggers.push(`${nbMeta.label}@${nbPos.row},${nbPos.col} → T${nextTier}`);
          }
        }
        // Garrison 转换(Synthflesh/Spymaster 放 Garrison 旁 → Garrison 转 Transcendent/Legion)
        if (cardId === "synthflesh_lab" || cardId === "spymaster") {
          for (const nbPos of adjacentInBounds(pos)) {
            const nbTile = tileAt(nbPos);
            if (nbTile?.content === "garrison" && !nbTile.destroyed) {
              const target = cardId === "synthflesh_lab" ? "升华守卫兵营 T2" : "军团兵营 T2";
              triggers.push(`驻军地@${nbPos.row},${nbPos.col} 转换 → ${target}`);
              break;
            }
          }
        }
        return triggers.length ? triggers.join(" · ") : null;
      }

      // 1) 手牌打到 target spec 匹配的格子上
      state.hand.forEach((cardId, handIdx) => {
        if (!cardId) return;
        for (const g of gap.gaps) {
          if (g.missing !== "content") continue;
          if (g.want !== cardId) continue;
          // 新增(2026-05-19 用户确认):跳过已占用格子(path / room),
          // 玩家不能直接放在 path/room 上(必须等塌陷清掉变 empty)。
          if (g.have && g.have !== "empty" && g.have !== "destroyed") continue;
          // #107 P2:spec match 分支同样校验 canPlaceRoom(跟 fallback 分支 line 159-162 一致).
          // 否则 spymaster spec 在 commander 同链格会通过 spec 匹配推出非法 play-card.
          if (cardId !== "path") {
            const verdict = canPlaceRoom(g.pos, cardId);
            if (!verdict.ok) continue;
          }
          const { value, adjReach, ring } = placeValue(g.pos);
          const tags = [];
          if (ring) tags.push("环成员");
          tags.push(adjReach ? "扩链 · 匹配目标" : "暂不连通");
          const cascade = detectCascadeTrigger(g.pos, cardId);
          if (cascade) tags.push(`★ 触发被动升级:${cascade}`);
          let cascadeBonus = cascade ? 30 : 0;  // 触发升级 +30 分,放更前
          actions.push({
            type: "play-card", handIdx, cardId, pos: { ...g.pos },
            title: `打 ${cardLabel(cardId)} → ${g.pos.row},${g.pos.col}(${tags.join(" · ")})`,
            gapValue: value + cascadeBonus
          });
        }
      });

      // 2) **基础铺路 / fallback** — 任何卡都可以铺在邻接可达的空格上(非 spec),作为「扩通用」。
      //   E2E round p 修:之前只对 path 卡 fallback,导致 named 卡若无 spec 匹配就完全无推荐(no_rec=25/25);
      //   现在 named 也可铺到 spec 外的邻接位置,优先级低于 spec 匹配但高于 -1000 孤立。
      const reachableNeighbors = reachableEmptyNeighbors(reachable);
      const specGapSet = new Set(gap.gaps.map(g => `${g.pos.row},${g.pos.col}`));
      state.hand.forEach((cardId, handIdx) => {
        if (!cardId) return;
        for (const pos of reachableNeighbors) {
          const key = `${pos.row},${pos.col}`;
          if (specGapSet.has(key)) continue;  // spec 内的已在 section 1 处理
          // named 卡要先确认能 canPlace(否则连通性会被链限制拒)
          if (cardId !== "path") {
            const verdict = canPlaceRoom(pos, cardId);
            if (!verdict.ok) continue;
          }
          const d = distFromFoyer(pos);  // 循环神庙策略:近 foyer 密铺优先
          const baseScore = cardId === "path" ? 180 : 60;  // path 仍优先 fallback;named fallback 低分
          actions.push({
            type: "play-card", handIdx, cardId, pos: { ...pos },
            title: `${cardId === "path" ? "铺基础通路" : `打 ${cardLabel(cardId)}`} → ${pos.row},${pos.col}(非目标,扩通用)`,
            gapValue: baseScore - d
          });
        }
      });

      // 3) **path 占位 spec named 格** — 演进 round q:
      //    nopath 模板手牌没 row 8 spine named 卡时完全卡死。允许 path 卡放 spec named 位置作临时占位,
      //    扩 reach 让后续 named 卡有机会(等 destab 清出来,或玩家保留卡到下次)。优先级低于 spec 匹配。
      state.hand.forEach((cardId, handIdx) => {
        if (cardId !== "path") return;
        for (const g of gap.gaps) {
          if (g.missing !== "content") continue;
          if (g.want === "path") continue;  // path spec 已在 section 1 处理
          // 跳过已占用格子(同 section 1)
          if (g.have && g.have !== "empty" && g.have !== "destroyed") continue;
          const adjReach = adjacentInBounds(g.pos).some(p => reachable.has(tileKey(p)));
          if (!adjReach) continue;  // 仍要求 adj reach,避免孤立 path
          const d = distFromFoyer(g.pos);
          actions.push({
            type: "play-card", handIdx, cardId: "path", pos: { ...g.pos },
            title: `path 占位 → ${g.pos.row},${g.pos.col}(spec 期望 ${cardLabel(g.want)},等 named 卡 destab 后 replace)`,
            gapValue: 100 - d  // 介于 spec match (200-d) 和 fallback (60-d) 之间
          });
        }
      });
      // 2) tier gap — 用 Quipolatl 升阶
      if (state.medallionPool.quipolatl > 0) {
        for (const g of gap.gaps) {
          if (g.missing !== "tier") continue;
          if (g.want > g.have && canUpgrade(g.pos).ok) {
            actions.push({
              type: "quipolatl", pos: { ...g.pos },
              title: `用升阶纹章 → ${g.pos.row},${g.pos.col} (T${g.have} → T${g.have+1})`,
              gapValue: 80
            });
          }
        }
      }
      // 3) medallion gap — 0.5 PN:锁牌已废防塌陷功能,不再推「贴 J 锁」补缺口动作。
      // 4) 击杀建筑师 meta — 综合判断 (round s, 2026-05-19):
      //    a) reward lock gap 存在 → 需要 Architect 击杀拿 RAC 卡放奖励房
      //    c) Q 升阶纹章 < 2 张 → 击杀拿 Q 纹章升 HV tier
      //    代价:wiki L185 击杀 architect 触发 30% 大塌陷,要权衡
      // 0.5 PN:锁牌已废防塌陷功能 — 删去原 (b) 补 J 锁池 / (d) 暴露 HV 补锁两项击杀理由。
      const rewardGaps = gap.gaps.filter(g => g.missing === "rewardLock" || (g.missing === "content" && ROOM_TYPES[g.want]?.category === "reward"));
      const qStock = state.medallionPool.quipolatl;

      const reasons = [];
      let score = 0;
      if (rewardGaps.length > 0) { reasons.push(`需 ${rewardGaps.length} 个奖励房`); score += 30; }
      if (qStock < 2) { reasons.push(`升阶纹章池 ${qStock}/2`); score += 15; }

      // 修复 #98 P2:Architect kill 是 30% 大塌陷,要把成本算进去。
      // 当前 reach 越大,损失越大。修复速度 ~1.5/visit 追不上一次 30% 塌陷.
      // 风险扣分 = reach × 0.30 × 8(每丢 1 cell 估 8 价值,跟 score 量级匹配).
      const reachNow = reachable.size;
      const expectedLoss = Math.floor(reachNow * 0.30);
      const riskPenalty = expectedLoss * 8;
      score -= riskPenalty;
      if (riskPenalty > 0) {
        reasons.push(`⚠ 代价:预计塌 ${expectedLoss} 格 (reach ${reachNow} × 30%)`);
      }

      if (score > 0) {
        const firstReward = rewardGaps[0];
        // 算可用奖励房槽位(模板预设的外缘格,且当前空或被塌陷的)
        const usableSlots = (target.rewardSlots || []).filter(s => {
          const t = tileAt(s);
          return t && (t.destroyed || t.content === "empty" || (t.content !== "architect_chamber" && !t.rewardLocked));
        }).slice(0, 6);
        // 把房间 id 转中文 label 给 UI 显示
        const rewardPlan = usableSlots.length > 0 && target.rewardPriority ?
          usableSlots.map((s, i) => {
            const id = target.rewardPriority[i] || "vault";
            const cn = ROOM_TYPES[id]?.label || "奖励房";
            return `${cn}@${s.row},${s.col}`;
          }).join(", ") : null;
        actions.push({
          type: "architect-kill-meta",
          title: `下次进神庙击杀建筑师 → 补纹章池 (${reasons.join(" · ")}) ⚠ 代价 30% 塌陷${rewardPlan ? " · 奖励房建议:" + rewardPlan + " (拿到开门钥匙卡请扔掉,不要放,以免误打老板触发大塌陷)" : ""}`,
          pos: firstReward ? { ...firstReward.pos } : null,
          rewardType: firstReward?.want,
          reasons,
          qStock, rewardGapsCount: rewardGaps.length,
          rewardSlots: usableSlots,
          rewardPlan,
          gapValue: score
        });
      }
      actions.sort((a, b) => (b.gapValue || 0) - (a.gapValue || 0));
      // 演进 round q:过滤掉负分(孤立放置 -1000+)。诚实告诉玩家"本轮手牌没好位置",
      // 比推个会被秒塌陷的孤立房好。剩 0 个就是 hand 无救。
      const goodActions = actions.filter(a => (a.gapValue || 0) >= 0);
      // round s.5:分离 meta 建议(architect-kill 等长期决策)与 play actions(本轮放卡)
      const metaAdvice = goodActions.filter(a => a.type === "architect-kill-meta");
      const playActions = goodActions.filter(a => a.type !== "architect-kill-meta");
      return { actions: [...playActions.slice(0, 10), ...metaAdvice], metaAdvice, gap };
    }

    // 从当前状态起,MC 模拟 visits 次进神庙,看多少次能达成 target 的所有 milestones。
    // 每个 visit = drawHand + recommendForGoal + apply actions + destabilise(按 exitStrategy)
    //
    // 修复 #98 P2:不再硬塞 atziri_chamber 到 (0,4)。Plan A/B/Probe 都刻意让 (0,4) 留空,
    // 旧逻辑强行通 Atziri 跟当前策略冲突,展望数据不可信。
    // mode 参数支持 "random" / "weighted" / "chain-end" — 校准阶段双方案对 chain-end 最敏感.
    function projectVisitsToGoal(target, maxVisits = 8, trials = 30, ruleSet = "0.5", mode = "random") {
      const eventName = target.exitStrategy ?? "close";
      const original = snapshot();
      const visitsHistogram = [];  // trials 个值:每个 trial 达成所有 milestone 时的 visit 数(-1 = 未达成)
      const finalProgresses = [];  // 每个 trial 终态 progress%

      for (let t = 0; t < trials; t++) {
        restore(original);
        // 修复 #98 P2:不再 pre-place atziri_chamber。当前策略下 (0,4) 留空避免通 Atziri.
        let achieved = -1;
        for (let v = 0; v < maxVisits; v++) {
          drawHand();
          // 每次进神庙最多打 6 张牌 — 每步重新生成 recommendForGoal(因为前一步改了状态)
          for (let i = 0; i < HAND_SIZE; i++) {
            const { actions } = recommendForGoal(target, ruleSet);
            if (!actions.length) break;
            const a = actions[0];
            if (a.type === "architect-kill-meta") break;  // meta 不在 visit 内处理
            const ok = applyPlanningAction(a);
            if (!ok) break;
          }
          // 模拟各掉源房按 GGPK medallionDrops 掉纹章(每 visit 一次,2026-06-03 起 9 房 per-tier 模型,非仅 Spymaster)
          collectMedallions();
          // 检查 milestones
          const gap = stateGapToTarget(target);
          if (gap.milestones.every(m => m.done) && achieved < 0) {
            achieved = v + 1;
          }
          // 跑塌陷事件(目标退出策略 + 实测 mode 参数)
          if (eventName === "architect" && state.architectPos) {
            // 模拟 architect 击杀 + Xipocado 放 reward room(贪心:把 spec 里第一张 reward 房放到对应 gap 位置)
            const rewardGap = gap.gaps.find(g => g.missing === "rewardLock" || (g.missing === "content" && ROOM_TYPES[g.want]?.category === "reward"));
            if (rewardGap) {
              placeRewardRoomFromConsole(rewardGap.pos, rewardGap.want);
            }
            placeArchitectAtRandomTile();
            // architect kill 触发塌陷
            const count = eventCount(ruleSet, "architect");
            applyDestabiliseBatch(count, ruleSet, { mode });
          } else {
            const count = eventCount(ruleSet, eventName);
            applyDestabiliseBatch(count, ruleSet, { mode });
          }
        }
        if (achieved < 0) achieved = maxVisits + 1;
        visitsHistogram.push(achieved);
        finalProgresses.push(stateGapToTarget(target).progress);
      }
      restore(original);

      return {
        target: target.label,
        trials,
        maxVisits,
        visitsHistogram: distStat(visitsHistogram.filter(v => v <= maxVisits)),
        completionRate: visitsHistogram.filter(v => v <= maxVisits).length / trials,
        finalProgress: distStat(finalProgresses)
      };
    }

    function recommendActions() {
      const { cur, rows } = allScoreBreakdowns(el("ruleSet").value);
      const actions = [];
      const phase = detectBuildPhase(el("ruleSet").value);
      const snake = evaluateSnakePotential(el("ruleSet").value);
      const plans = rankPlans(el("ruleSet").value);
      actions.push({
        kind: "good",
        title: `当前阶段: ${phase.label}`,
        body: phase.body
      });
      actions.push({
        kind: snake.strict && snake.branchCount === 0 ? "good" : "warning",
        title: `蛇形潜力: ${snake.routeProgress}% · ${snake.strict ? "严格单链" : "非严格"}`,
        body: `链长 ${snake.chainLength},可达 ${snake.reachableSize},端点 ${snake.endpoints},分叉 ${snake.branchCount},高价值断链点 ${snake.highValueCutCount}(0.5 下会降级)。`
      });
      if (plans.length) {
        actions.push(...plans.map((plan, i) => ({
          kind: i === 0 ? "good" : "warning",
          title: `推进方案 ${i + 1}: ${actionLabel(plan.sequence[0])}`,
          body: plan.reason
        })));
      } else if (state.hand.length === 0) {
        actions.push({ kind: "warning", title: "先抽手牌", body: "当前没有手牌。开荒规划需要至少知道这轮 6 张卡,才能判断铺路、接房或重抽。" });
      }
      // 修复 #98 P1:循环策略下不主动通 Atziri。Probe/Plan A/Plan B 都刻意让 (0,4) 留空。
      // 旧逻辑"优先打通 Atziri"已弃 — 改成提醒玩家**避免**通。
      if (cur.atziriReachable) {
        actions.push({ kind: "warning", title: "⚠ Atziri 已可达 — 别误打", body: "(0,4) 已被路径或 atziri_chamber 连通。循环刷神庙下打 Atziri = 大塌陷 ~50% reach,等于神庙重置。如果不想终局,清掉顶部连接。" });
      }
      for (const bd of rows) {
        if (bd.meta.needsPower && !hasRequiredPower(bd.pos, cur.powered) && bd.base >= 12) {
          actions.push({ kind: "warning", title: `补供能: ${bd.meta.label} ${bd.pos.row},${bd.pos.col}`, body: `当前供能 ${cur.powered.counts?.get(tileKey(bd.pos)) ?? 0}/${Math.max(1, bd.meta.powerCount ?? 1)}。不补供能时规划分只计手动权重。` });
          break;
        }
      }
      // 0.5 PN:锁牌已废防塌陷功能 — 删去原「考虑贴锁定纹章保护断链高价值房」警告。
      // 断链 HV 房的有效解法(闭环免疫降级)由上方 phase detector 的 ring-close 相位给出。
      for (const bd of rows) {
        const verdict = canUpgrade(bd.pos);
        if (verdict.ok && bd.score > 0 && bd.tile.tier < bd.meta.maxTier) {
          actions.push({ kind: "good", title: `可升级: ${bd.meta.label} ${bd.pos.row},${bd.pos.col}`, body: `当前 T${bd.tile.tier},规划分 ${Math.round(bd.score)}。升级前仍需确认新赛季邻接限制是否变动。` });
          break;
        }
      }
      const best = rows.find(r => r.score > 0);
      if (best) {
        actions.push({ kind: "good", title: `当前最高规划分: ${best.meta.label}`, body: `${best.pos.row},${best.pos.col} · ${Math.round(best.score)} 分。${best.flags.length ? best.flags.join(" · ") : "条件完整"}` });
      }
      return actions.slice(0, 7);
    }

    // 全局收益 = 期望掉落乘式(mod stack)+ reward vault 一次性 + boss 修正
    // L = BASE_LOOT × Π(1 + stat_total)            ← mod 房贡献
    //   + Σ(reward vault values)                    ← 一次性宝库
    //   + atziri-route 奖惩
