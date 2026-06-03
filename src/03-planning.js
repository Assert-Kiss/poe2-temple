    function canThreatenRoute(pos) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty") return false;
      return reachableFromFoyer().has(tileKey(pos)) && wouldDisconnect(pos);
    }

    function occupiedSlots() {
      const slots = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (tile && !tile.destroyed && tile.content !== "empty") slots.push(pos);
      }
      return slots;
    }

    function emptySlots() {
      const slots = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        if (isFoyerTile(pos)) continue;
        const tile = tileAt(pos);
        if (!tile) continue;
        if (tile.destroyed || tile.content === "empty") slots.push(pos);
      }
      return slots;
    }

    function degreeMap(reachable = reachableFromFoyer()) {
      const deg = new Map();
      for (const key of reachable) deg.set(key, 0);
      for (const key of reachable) {
        const pos = parseKey(key);
        for (const next of adjacentInBounds(pos)) {
          if (reachable.has(tileKey(next)) && canConnect(pos, next)) {
            deg.set(key, deg.get(key) + 1);
          }
        }
      }
      return deg;
    }

    function chainEndpoints(reachable = reachableFromFoyer()) {
      const deg = degreeMap(reachable);
      return [...deg.entries()]
        .filter(([, d]) => d <= 1)
        .map(([key]) => parseKey(key))
        .filter(Boolean);
    }

    function reachableEmptyNeighbors(reachable = reachableFromFoyer()) {
      const seen = new Set();
      const out = [];
      for (const key of reachable) {
        const pos = parseKey(key);
        for (const next of adjacentInBounds(pos)) {
          const nk = tileKey(next);
          if (seen.has(nk) || isFoyerTile(next)) continue;
          const tile = tileAt(next);
          if (tile && (tile.destroyed || tile.content === "empty")) {
            seen.add(nk);
            out.push(next);
          }
        }
      }
      return out;
    }

    function minDistanceToAtziri(reachable = reachableFromFoyer()) {
      if (reachable.has(tileKey(ATZIRI_TILE)) && tileContent(ATZIRI_TILE) !== "empty") return 0;
      let best = Infinity;
      for (const key of reachable) {
        const pos = parseKey(key);
        best = Math.min(best, Math.abs(pos.row - ATZIRI_TILE.row) + Math.abs(pos.col - ATZIRI_TILE.col));
      }
      return best === Infinity ? Math.abs(FOYER_TILE.row - ATZIRI_TILE.row) : best;
    }

    // 闭环健康度统计 — 用于 UI 指标和环形目标的进度展示
    // 返回:
    //   reachableTiles 可达格子总数(不含 foyer)
    //   cutCount cut vertex 数(0.5 会降级,链上痛点)
    //   nonCutCount 非 cut vertex 数(环成员,0.5 会移除留空格,可补卡)
    //   hvOnRing HV 房在环上(非 cut)数
    //   hvOnChain HV 房在链上(cut vertex)数
    function computeRingHealth(reachable = reachableFromFoyer()) {
      let cutCount = 0;
      let nonCutCount = 0;
      let hvOnRing = 0;
      let hvOnChain = 0;
      for (const key of reachable) {
        const pos = parseKey(key);
        if (isFoyerTile(pos)) continue;
        if (!isDestabiliseEligible(pos)) continue;  // atziri / 锁定纹章 / reward-locked 都跳过
        const cut = wouldDisconnect(pos, reachable);
        if (cut) cutCount++;
        else nonCutCount++;
        if (roomValue(pos) >= 12) {
          if (cut) hvOnChain++;
          else hvOnRing++;
        }
      }
      return {
        reachableTiles: reachable.size - 1,
        cutCount, nonCutCount,
        hvOnRing, hvOnChain
      };
    }

    // 牺牲支链缓冲 = 「比所有未锁定高价值房都远的可塌陷格子」数
    // chain-end-first 塌陷算法下,这些格子会优先吸打击 → HV 房受保护。
    // 0.5 上线后这是替代纹章锁定的备选策略;planner 应主动建议铺支链。
    function computeLimbBuffer(reachable = reachableFromFoyer()) {
      const dist = tileChainDistance();
      let maxHVDist = -1;
      for (const key of reachable) {
        const pos = parseKey(key);
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        // 0.5 PN:锁牌不再防塌陷 — 锁定 HV 房和普通 HV 房一样需要支链缓冲,不再跳过。
        const meta = ROOM_TYPES[tile.content];
        if (!meta) continue;
        if (meta.destabiliseEligible === false) continue;  // atziri 等免疫房跳过
        if (roomValue(pos) < 12) continue;  // 低价值房不需要支链保护
        const d = dist.get(key) ?? 0;
        if (d > maxHVDist) maxHVDist = d;
      }
      if (maxHVDist < 0) return { buffer: 0, maxHVDist: -1 };  // 没未保护 HV 房 → 不需要支链
      let buffer = 0;
      for (const key of reachable) {
        const pos = parseKey(key);
        if (!isDestabiliseEligible(pos)) continue;
        const d = dist.get(key) ?? 0;
        if (d > maxHVDist) buffer++;
      }
      return { buffer, maxHVDist };
    }

    function componentValue(keys) {
      let value = 0;
      let highValue = 0;
      let named = 0;
      for (const key of keys) {
        const pos = parseKey(key);
        if (!pos || isFoyerTile(pos)) continue;
        const tile = tileAt(pos);
        if (!tile || tile.destroyed || tile.content === "empty" || tile.content === "path") continue;
        const v = roomValue(pos);
        value += v;
        named++;
        if (v >= 12) highValue++;
      }
      return { value, highValue, named };
    }

    function reachableWithout(blockedKey, reachable = reachableFromFoyer()) {
      const foyerKey = tileKey(FOYER_TILE);
      const seen = new Set();
      if (blockedKey === foyerKey || tileContent(FOYER_TILE) === "empty") return seen;
      seen.add(foyerKey);
      const queue = [FOYER_TILE];
      while (queue.length) {
        const pos = queue.shift();
        for (const next of adjacentInBounds(pos)) {
          const key = tileKey(next);
          if (key === blockedKey || seen.has(key) || !reachable.has(key)) continue;
          if (canConnect(pos, next)) {
            seen.add(key);
            queue.push(next);
          }
        }
      }
      return seen;
    }

    function downtimeEstimate(repairState) {
      if (!repairState.fragile.length) return 0;
      const worst = repairState.fragile[0];
      let steps = 1; // 至少要一次手牌 / 放置动作来解除风险
      if (worst.lostHighValue > 0) steps += 1;
      if (repairState.placements.length === 0) steps += 1;
      return Math.max(1, Math.min(6, steps + Math.min(2, Math.floor(repairState.fragile.length / 4))));
    }

    function dutyCycleEstimate(peakValue, valleyLoss, recoverySteps) {
      const peakTurns = 6; // 经验窗口:一次抢修低谷后,期望能维持数轮高位;待实测校准。
      const peak = Math.max(0, Math.round(peakValue));
      const valley = Math.max(0, Math.round(peakValue - valleyLoss));
      const recovery = Math.max(1, recoverySteps || 1);
      const steady = Math.round((peakTurns * peak + recovery * valley) / (peakTurns + recovery));
      return {
        peakTurns,
        recoveryTurns: recovery,
        peakValue: peak,
        valleyValue: valley,
        valleyLoss: Math.max(0, Math.round(valleyLoss)),
        steadyValue: steady
      };
    }

    function scoreRepairPlacement(pos, currentReachable, fragileTargets, beforeDuty) {
      const before = currentReachable.size;
      const tile = tileAt(pos);
      if (!tile || (!tile.destroyed && tile.content !== "empty")) return null;
      const saved = { content: tile.content, tier: tile.tier, destroyed: tile.destroyed, medallion: tile.medallion };
      tile.content = "path";
      tile.tier = 0;
      tile.destroyed = false;
      tile.medallion = null;
      const afterReachable = reachableFromFoyer();
      const afterAnalysis = computeRepairState({ includePlacements: false });
      tile.content = saved.content;
      tile.tier = saved.tier;
      tile.destroyed = saved.destroyed;
      tile.medallion = saved.medallion;

      const connectedGain = Math.max(0, afterReachable.size - before);
      let relieved = 0;
      let relievedLoss = 0;
      for (const fragile of fragileTargets) {
        const now = afterAnalysis.fragile.find(f => f.key === fragile.key);
        const beforeLoss = Math.max(0, fragile.lostValue ?? 0);
        const afterLoss = Math.max(0, now?.lostValue ?? 0);
        if (!now || afterLoss <= 0) relieved++;
        relievedLoss += Math.max(0, beforeLoss - afterLoss);
      }
      const dist = Math.abs(pos.row - FOYER_TILE.row) + Math.abs(pos.col - FOYER_TILE.col);
      const afterDuty = afterAnalysis.dutyCycle;
      const globalPreventedLoss = Math.max(0, (beforeDuty?.valleyLoss ?? 0) - (afterDuty?.valleyLoss ?? 0));
      const preventedLoss = Math.max(globalPreventedLoss, relievedLoss);
      const steadyGain = Math.max(0, (afterDuty?.steadyValue ?? 0) - (beforeDuty?.steadyValue ?? 0));
      return {
        pos: { ...pos },
        connectedGain,
        relieved,
        preventedLoss,
        steadyGain,
        recoveryTurnsAfter: afterDuty?.recoveryTurns ?? 0,
        steadyValueAfter: afterDuty?.steadyValue ?? 0,
        score: relieved * 100 + preventedLoss * 2 + steadyGain + connectedGain * 8 - dist
      };
    }

    // 实战抢修状态:把 0.5 的断链降级问题转成可执行的图论控制量。
    // fragile = 当前一旦被命中就会让下游收益掉线的割点 / 唯一桥。
    // placements = 用任意过渡卡先补哪一格,能最快解除唯一桥脆弱期。
    function computeRepairState(opts = {}) {
      const includePlacements = opts.includePlacements !== false;
      const reachable = reachableFromFoyer();
      const dist = tileChainDistance();
      const fragile = [];
      const allValue = componentValue(reachable);

      for (const key of reachable) {
        const pos = parseKey(key);
        if (!pos || isFoyerTile(pos)) continue;
        if (!isDestabiliseEligible(pos)) continue;
        const tile = tileAt(pos);
        if (!tile || tile.destroyed || tile.content === "empty") continue;
        const after = reachableWithout(key, reachable);
        if (after.size >= reachable.size - 1) continue;
        const lostKeys = [];
        for (const k of reachable) {
          if (k !== key && !after.has(k)) lostKeys.push(k);
        }
        const lost = componentValue(lostKeys);
        const selfValue = tile.content === "path" ? 0 : roomValue(pos);
        // 0.5 PN:锁牌不再防塌陷 — severity 不因 medallion 打折(原 protectedByLock -25 已删)。
        const severity = lost.value + lost.highValue * 20 + selfValue;
        fragile.push({
          key,
          pos: { ...pos },
          content: tile.content,
          label: ROOM_TYPES[tile.content]?.label || (tile.content === "path" ? "通路" : tile.content),
          tier: tile.tier ?? 0,
          distance: dist.get(key) ?? 0,
          lostReachable: lostKeys.length,
          lostValue: Math.round(lost.value),
          lostHighValue: lost.highValue,
          selfValue: Math.round(selfValue),
          severity: Math.round(severity)
        });
      }
      fragile.sort((a, b) => b.severity - a.severity || b.distance - a.distance);

      const valleyLoss = fragile.length ? Math.max(...fragile.map(f => Math.max(0, f.lostValue))) : 0;
      const partial = {
        fragile,
        placements: [],
        dutyCycle: null
      };
      partial.dutyCycle = dutyCycleEstimate(allValue.value, valleyLoss, downtimeEstimate(partial));

      let placements = [];
      if (includePlacements && fragile.length) {
        const fragileTargets = fragile.slice(0, 6);
        const candidates = reachableEmptyNeighbors(reachable);
        for (const pos of candidates) {
          const scored = scoreRepairPlacement(pos, reachable, fragileTargets, partial.dutyCycle);
          if (scored) placements.push(scored);
        }
        placements.sort((a, b) => b.score - a.score);
        placements = placements.slice(0, 5);
      }

      return {
        reachableSize: reachable.size,
        totalValue: Math.round(allValue.value),
        highValue: allValue.highValue,
        dutyCycle: partial.dutyCycle,
        fragile,
        placements
      };
    }

    function evaluateSnakePotential(ruleSet = el("ruleSet").value) {
      const cur = totalScore(ruleSet);
      const reachable = cur.reachable;
      const chain = buildChain();
      const deg = degreeMap(reachable);
      let branchCount = 0;
      let cutCount = 0;
      let highValueCutCount = 0;
      let highValueReachable = 0;
      // 0.5 PN:锁牌不再防塌陷 — 不再区分「已锁 / 未锁」断链点,所有 HV 断链点都算暴露。
      for (const [key, d] of deg) {
        if (d > 2) branchCount++;
        const pos = parseKey(key);
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        if (roomValue(pos) >= 12 && tile.content !== "path") highValueReachable++;
        if (key !== tileKey(FOYER_TILE) && wouldDisconnect(pos, reachable)) {
          cutCount++;
          if (roomValue(pos) >= 12 && tile.content !== "path") highValueCutCount++;
        }
      }
      const endpoints = chainEndpoints(reachable);
      const expansion = reachableEmptyNeighbors(reachable);
      const distanceToAtziri = minDistanceToAtziri(reachable);
      const maxDistance = Math.abs(FOYER_TILE.row - ATZIRI_TILE.row) + Math.abs(FOYER_TILE.col - ATZIRI_TILE.col);
      const routeProgress = maxDistance ? Math.round((1 - distanceToAtziri / maxDistance) * 100) : 100;
      return {
        strict: state.chainStrict,
        chainLength: chain.length,
        reachableSize: reachable.size,
        endpoints: endpoints.length,
        branchCount,
        cutCount,
        highValueCutCount,
        highValueReachable,
        expansionCount: expansion.length,
        distanceToAtziri,
        routeProgress: Math.max(0, Math.min(100, routeProgress)),
        atziriReachable: cur.atziriReachable,
        planningScore: cur.score
      };
    }

    function reachableSpymasterTiles(reachable = reachableFromFoyer()) {
      const out = [];
      for (const key of reachable) {
        const pos = parseKey(key);
        const tile = tileAt(pos);
        if (tile && !tile.destroyed && tile.content === "spymaster") out.push({ pos, tier: tile.tier });
      }
      return out;
    }

    function detectBuildPhase(ruleSet = el("ruleSet").value) {
      const snake = evaluateSnakePotential(ruleSet);
      const { rows } = allScoreBreakdowns(ruleSet);
      const cur = totalScore(ruleSet);
      const missingPower = rows.find(bd => bd.meta.needsPower && !hasRequiredPower(bd.pos, cur.powered) && bd.base >= 12);
      // 0.5 PN:锁牌不再防塌陷 — 所有 HV 断链点都算暴露,不再减去「已锁」数。
      const exposedHV = snake.highValueCutCount;
      if (snake.reachableSize <= 3 || snake.chainLength <= 3) {
        return { id: "foundation", label: "起步铺路", body: "先用通路/低价值房扩可达区,不要急着把高价值房放在会断链的位置。" };
      }
      // round v.7 (任务 #51):删除 "boss-route" 阶段(永不主动通顶部老板),
      // fallthrough 到后面的 snake-protect/power-economy/profit-polish。
      // 0.4 拓扑:鼓励 strict snake;0.5 不强制
      if (ruleSet === "0.4" && (!snake.strict || snake.branchCount > 0)) {
        return { id: "snake-shape", label: "整理蛇形", body: `当前有 ${snake.branchCount} 个分叉/非单链结构。0.4 下塌陷会跳过断链关键房 — 先减少额外支路。` };
      }
      // 0.5 PN:锁牌已废防塌陷功能,不再有「贴锁/采集锁/放密探补锁」三连建议。
      // 断链 HV 房在 0.5 下被命中会被降级成通路 → 唯一可控的解法是闭环让它们变非断链(免疫降级)。
      if (exposedHV > 0) {
        const ring = computeRingHealth(cur.reachable);
        if (ring.hvOnChain > 0 && ring.hvOnRing < 3) {
          return {
            id: "ring-close",
            label: "闭环让 HV 免疫降级",
            body: `有 ${exposedHV} 个高价值断链点。0.5 下断链 HV 被命中会降级成通路,收益吃掉。把它们接成闭环(非断链)即可免疫降级。`
          };
        }
      }
      if (missingPower) {
        return {
          id: "power-economy",
          label: "补供能(+1 effective tier)",
          body: `${missingPower.meta.label} 在可达范围但缺 Generator 供能。**0.5 真实机制**:被供能的房 modBonus 用 tier+1 的 % 算 — 比如 T1 Smithy 不供能 +15% 物品稀有度,供能后按 T2 的 +30% 算。补 Generator 收益直接翻倍。`
        };
      }
      return { id: "profit-polish", label: "收益打磨", body: "路线稳定后,优先升阶/强化可达高价值房。考虑用「对比所有模板」按钮跑长期模拟,看哪个布局对你的纹章存量最合适。Atlas Tree 解锁后可推 T4。" };
    }

    function phaseDetector(ruleSet = el("ruleSet").value) {
      return detectBuildPhase(ruleSet);
    }

    function routeCandidateScore(pos, reachable = reachableFromFoyer()) {
      const before = minDistanceToAtziri(reachable);
      const dist = Math.abs(pos.row - ATZIRI_TILE.row) + Math.abs(pos.col - ATZIRI_TILE.col);
      const nearReachable = adjacentInBounds(pos).some(p => reachable.has(tileKey(p)));
      const endpointAdj = chainEndpoints(reachable).some(p => gridAdjacent(p, pos));
      let score = 0;
      if (nearReachable) score += 16;
      if (endpointAdj) score += 18;
      score += Math.max(0, before - dist) * 12;
      if (pos.col === ATZIRI_TILE.col) score += 4;
      if (pos.row < FOYER_TILE.row) score += 2;
      return score;
    }

    function planningState(ruleSet = el("ruleSet").value) {
      const cur = totalScore(ruleSet);
      const snake = evaluateSnakePotential(ruleSet);
      return { cur, snake };
    }

    function applyPlanningAction(action) {
      if (action.type === "play-card") return playCard(action.handIdx, action.pos);
      // 0.5 PN:锁牌已废防塌陷功能 — 不再生成 juatalotli 动作,planner 不执行贴锁。
      if (action.type === "quipolatl") return consumeQuipolatl(action.pos);
      if (action.type === "zantipi") return consumeZantipi();
      if (action.type === "puhuarte") return true;
      return false;
    }

    function actionLabel(action) {
      if (action.type === "play-card") {
        const name = action.cardId === "path" ? "通路" : (ROOM_TYPES[action.cardId]?.label ?? action.cardId);
        return `打出 ${name} → ${action.pos.row},${action.pos.col}`;
      }
      if (action.type === "quipolatl") return `用升阶纹章 → ${action.pos.row},${action.pos.col}`;
      if (action.type === "zantipi") return `用强化纹章 → ${action.pos.row},${action.pos.col}`;
      if (action.type === "puhuarte") return "用重抽纹章换手牌";
      return action.title || "未知动作";
    }

    function generateActions(ruleSet = el("ruleSet").value) {
      const actions = [];
      const reachable = reachableFromFoyer();
      const targets = reachableEmptyNeighbors(reachable);
      const empties = emptySlots();
      const routeTargets = (targets.length ? targets : empties)
        .map(pos => ({ pos, value: routeCandidateScore(pos, reachable) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12)
        .map(x => x.pos);

      state.hand.forEach((cardId, handIdx) => {
        if (!cardId) return;
        const playableTargets = cardId === "path" ? routeTargets : routeTargets.concat(empties.slice(0, 8));
        const seen = new Set();
        for (const pos of playableTargets) {
          const key = tileKey(pos);
          if (seen.has(key) || isFoyerTile(pos)) continue;
          seen.add(key);
          actions.push({
            type: "play-card",
            handIdx,
            cardId,
            pos: { ...pos },
            title: actionLabel({ type: "play-card", handIdx, cardId, pos })
          });
        }
      });

      const { rows } = allScoreBreakdowns(ruleSet);
      // 0.5 PN:锁牌已废防塌陷功能 — 不再注入「贴锁定纹章」动作(quipolatl/zantipi 等有效纹章保留)。
      if (state.medallionPool.quipolatl > 0) {
        rows
          .filter(bd => canUpgrade(bd.pos).ok && bd.tile.tier < bd.meta.maxTier)
          .slice(0, state.medallionPool.quipolatl + 2)
          .forEach(bd => actions.push({ type: "quipolatl", pos: { ...bd.pos }, title: actionLabel({ type: "quipolatl", pos: bd.pos }) }));
      }
      if (state.medallionPool.zantipi > 0) {
        rows
          .filter(bd => bd.score > 0 && bd.tile.content !== "path")
          .slice(0, state.medallionPool.zantipi + 2)
          .forEach(bd => actions.push({ type: "zantipi", pos: { ...bd.pos }, title: actionLabel({ type: "zantipi", pos: bd.pos }) }));
      }
      const hasRouteCard = state.hand.some(card => card === "path");
      const canAdvanceWithHand = actions.some(a => a.type === "play-card" && a.cardId === "path" && routeCandidateScore(a.pos, reachable) > 18);
      if (state.medallionPool.puhuarte > 0 && (!hasRouteCard || !canAdvanceWithHand)) {
        actions.push({ type: "puhuarte", title: actionLabel({ type: "puhuarte" }) });
      }
      return actions;
    }

    function scorePlanningTransition(before, after, action, phase) {
      let score = 0;
      score += (after.cur.score - before.cur.score) * 0.45;
      score += (after.snake.reachableSize - before.snake.reachableSize) * 7;
      // 修复 #98 P2:去掉 distanceToAtziri 变短 + 打通 Atziri 的奖励。循环策略下不主动通,beam search 不该把
      // "向 (0,4) 推进" 当好动作。
      if (after.snake.strict) score += 12;
      score -= after.snake.branchCount * 12;
      // 0.5 PN:锁牌不再防塌陷 — 去掉「锁住断链点 +30」奖励;减少 HV 断链点(靠闭环/改拓扑)仍加分。
      score += Math.max(0, before.snake.highValueCutCount - after.snake.highValueCutCount) * 10;
      score += (after.snake.highValueReachable - before.snake.highValueReachable) * 8;
      // 修复 #98 P2:phase boss-route 这一阶段在 round #51 已被弃用,残留 phase id 兜底.
      // 这里去掉对它的特殊加分,只保留 foundation 的 path 加分(早期铺路真有用).
      if (action.type === "puhuarte") score += phase.id === "foundation" ? 22 : 8;
      if (action.type === "play-card" && action.cardId === "path") {
        score += phase.id === "foundation" ? 34 : 10;
      }
      if (action.type === "play-card" && action.cardId !== "path" && phase.id === "foundation") score -= 18;
      return score;
    }

    function explainPlanningTransition(before, after, action, phase, score) {
      const reasons = [];
      if (action.type === "puhuarte") {
        reasons.push("当前手牌难以推进主线,重抽优先找通路/可接入房");
      }
      // 修复 #98 P2:去掉 "直接打通阿兹里路线 / Boss 路线推进 N 格" 文案 — 这些是旧 boss-route 倾向.
      const reachGain = after.snake.reachableSize - before.snake.reachableSize;
      if (reachGain > 0) reasons.push(`可达格 +${reachGain}`);
      if (!before.snake.strict && after.snake.strict) reasons.push("恢复单链蛇形");
      if (after.snake.branchCount < before.snake.branchCount) reasons.push("减少分叉");
      // 0.5 PN:锁牌不再防塌陷 — 去掉「锁住断链点」理由;断链 HV 减少(闭环/改拓扑)才是有效收益。
      const cutReduced = before.snake.highValueCutCount - after.snake.highValueCutCount;
      if (cutReduced > 0) reasons.push(`断链高价值点 -${cutReduced}`);
      const exposed = after.snake.highValueCutCount;
      if (exposed > 0) reasons.push(`仍有 ${exposed} 个高价值断链点会吃新塌陷规则`);
      const scoreGain = Math.round(after.cur.score - before.cur.score);
      if (scoreGain > 0) reasons.push(`规划分 +${scoreGain}`);
      if (!reasons.length) reasons.push(phase.body);
      return `${reasons.slice(0, 3).join("；")}。综合优先级 ${Math.round(score)}。`;
    }

    function simulateActionSequence(sequence, ruleSet = el("ruleSet").value) {
      const original = snapshot();
      const phase = detectBuildPhase(ruleSet);
      const before = planningState(ruleSet);
      let ok = true;
      for (const action of sequence) {
        if (action.type === "puhuarte") continue;
        ok = applyPlanningAction(action);
        if (!ok) break;
      }
      const after = planningState(ruleSet);
      const score = ok ? scorePlanningTransition(before, after, sequence[0], phase) : -Infinity;
      const reason = ok ? explainPlanningTransition(before, after, sequence[0], phase, score) : "动作当前无法执行。";
      restore(original);
      return { sequence, before, after, score, reason, ok };
    }

    // ===== state-value heuristic + beam search =====
    // stateValue 把 totalScore(经济模型)+ snake-shape 健康度合并成单一标量,beam search 拿它做 argmax。
    // 经济(totalScore)只看当下乘式;策略性奖励(连通、Atziri 通、保护断链)在这里加。
    // round v.7 (2026-05-19,任务 #50):**循环刷神庙策略下,去掉 atziri 倾向**。
    // 之前 stateValue 把"通 atziri"当奖励(+60)、"距 atziri 越近越好"(-6/格)、
    // "未通 atziri 惩罚已放 mod/reward 房"。这跟"永不打老板,循环刷"目标冲突 —
    // 蛇形模板因 100% 通 atziri 在旧评分下被高估,侧链因 6% 通 atziri 反而被低估。
    // 新评分:atziri 不奖励也不惩罚(玩家自己决定),距离不影响,reach 大小是核心产出代理。
    function stateValue(ruleSet) {
      const cur = totalScore(ruleSet);
      const snake = evaluateSnakePotential(ruleSet);
      let v = cur.score;
      v += snake.reachableSize * 3;          // 每多 1 格可达 = 多 1 个潜在 mod 来源
      // 0.5 PN:锁牌不再防塌陷 — 去掉「已锁断链点 +25」奖励;HV 断链点一律按暴露惩罚。
      v -= snake.highValueCutCount * 8;
      // 0.4 vs 0.5 拓扑奖励差异:
      //   0.4:断链关键房被跳过 → 单链最优(0.4 历史下锁牌还能额外锁住,但 planner 不再推)
      //   0.5:断链关键房被降级为通路 → 环形(HV 非断链)和"环 + 支链"才是最优
      if (ruleSet === "0.5") {
        const ring = computeRingHealth(cur.reachable);
        v += ring.hvOnRing * 18;             // 环上 HV 在 0.5 下完全免疫降级
        v -= snake.branchCount * 3;          // 0.5 下分叉不再可怕(降级不留空洞)
      } else {
        v += snake.strict ? 8 : 0;
        v -= snake.branchCount * 10;
      }
      // 支链 buffer 奖励 — 不管 atziri 是否可达,只要有 HV 房 + buffer 就奖励
      const { buffer } = computeLimbBuffer(cur.reachable);
      v += Math.min(buffer, 12) * 4;
      // 早期建造(reach < 8)优先扩链 — 轻度抑制 mod 房,鼓励 path 先铺出网络。
      // 这不依赖 atziri 状态(循环策略下我们也不在乎 atziri 通不通),只看 reach 大小。
      if (snake.reachableSize < 8) {
        let modPlaced = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const t = state.tiles[r][c];
          if (!t || t.destroyed) continue;
          const meta = ROOM_TYPES[t.content];
          if (meta?.modBonus?.length) modPlaced++;
        }
        v -= modPlaced * 20;  // 比旧版 -25 轻一点,但足以让早期 path 优先扩链(reach <8 阶段)
      }
      // 惩罚非 console 放置的 reward 房 — reward 房只能从击杀建筑师后的菜单放
      let unconsoleReward = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const t = state.tiles[r][c];
        if (!t || t.destroyed) continue;
        const meta = ROOM_TYPES[t.content];
        if (meta?.category === "reward" && !t.rewardLocked) unconsoleReward++;
      }
      v -= unconsoleReward * 30;
      return v;
    }

    // 快速预筛动作 — 避免对每个动作都跑 stateValue 那么贵。
    // 重要:playCard 始终放 T1,所以按 T1 % 估值(早期常见误差:按 T3 估,但放下的是 T1)
    //
    // 2026-05-18 升级级联奖励:放下一张卡时,如果它能触发**邻居自动升 tier**或**转换形成**,
    // 实际收益远超 T1 modBonus 数字。例如:Armoury 放在 Garrison T1 旁,Garrison 自动 T1→T2;
    // Synthflesh 放在 Garrison 旁,Garrison 转换为 T2 Transcendent。
    // 没有这条奖励,beam search 会因 quickScore 太低把这些机会过滤掉。
    function quickActionScore(action) {
      if (action.type === "play-card") {
        if (action.cardId === "path") return 30;
        const meta = ROOM_TYPES[action.cardId];
        let score = 5;
        if (meta?.modBonus?.length) {
          const t1 = meta.modBonus.reduce((sum, e) => sum + (e.byTier[0] || 0), 0);
          score = Math.min(50, t1);
        } else if (meta?.category === "reward") {
          // 循环刷神庙策略下,reward 房只能从击杀建筑师后的菜单放(rewardLocked),
          // 不该从普通手牌推。即使 hand 里有(测试/异常 state),也不推。
          score = -50;
        }
        // 邻接升级触发奖励:看 4 邻里有没有需要本卡作邻接源升级的房
        if (action.pos) {
          for (const nbPos of adjacentInBounds(action.pos)) {
            const nbTile = tileAt(nbPos);
            if (!nbTile || nbTile.destroyed) continue;
            const nbMeta = ROOM_TYPES[nbTile.content];
            if (!nbMeta?.upgradeAdjacency) continue;
            const nextTier = (nbTile.tier ?? 0) + 1;
            const rule = nbMeta.upgradeAdjacency[String(nextTier)];
            if (!rule) continue;
            const rooms = Array.isArray(rule) ? rule : (rule.rooms || []);
            if (rooms.includes(action.cardId)) {
              score += 20;  // 邻居能升一级 = 大奖励
            }
          }
          // Garrison 转换奖励(0.5 PN line 426-427):
          // Synthflesh 邻 Garrison → 转 T2 Transcendent;Spymaster 邻 Garrison → 转 T2 Legion
          if (action.cardId === "synthflesh_lab" || action.cardId === "spymaster") {
            for (const nbPos of adjacentInBounds(action.pos)) {
              const nbTile = tileAt(nbPos);
              if (nbTile?.content === "garrison" && !nbTile.destroyed) {
                score += 30;  // Garrison 一步直升 T2 派生形态 = 大奖励
                break;
              }
            }
          }
        }
        return score;
      }
      // 0.5 PN:锁牌已废防塌陷 — 不再有 juatalotli 动作可评分。
      if (action.type === "quipolatl") return 22;  // 升阶纹章 — 把已有 T1/T2 升,价值高
      if (action.type === "zantipi") return 16;
      if (action.type === "puhuarte") return 10;
      return 0;
    }

    function actionUniqueKey(action) {
      if (!action) return "noop";
      if (action.type === "play-card") return `play:${action.cardId}:${action.pos.row},${action.pos.col}`;
      if (["quipolatl","zantipi"].includes(action.type)) return `${action.type}:${action.pos.row},${action.pos.col}`;
      if (action.type === "puhuarte") return "puhuarte";
      return "unknown";
    }

    // depth-D beam search,beamWidth-K 个候选,每个 state 最多扩 actionCap 个 action(按 quickActionScore 预筛)。
    // allPlans 累积所有非空序列,即便 beam 中途扩不下去也能返回早期计划。
    function beamSearchPlans(ruleSet = el("ruleSet").value, opts = {}) {
      const depth = opts.depth ?? 3;
      const beamWidth = opts.beamWidth ?? 5;
      const actionCap = opts.actionCap ?? 15;

      const original = snapshot();
      const initialValue = stateValue(ruleSet);

      let beam = [{ snap: original, sequence: [], value: initialValue }];
      const allPlans = [];

      for (let d = 0; d < depth; d++) {
        const expansions = [];
        for (const node of beam) {
          restore(node.snap);
          const rawActions = generateActions(ruleSet);
          const candidates = rawActions
            .map(a => ({ a, q: quickActionScore(a) }))
            .sort((x, y) => y.q - x.q)
            .slice(0, actionCap)
            .map(x => x.a);

          for (const action of candidates) {
            const beforeSnap = snapshot();
            const ok = applyPlanningAction(action);
            if (!ok) {
              restore(beforeSnap);
              continue;
            }
            const value = stateValue(ruleSet);
            const child = {
              snap: snapshot(),
              sequence: [...node.sequence, action],
              value
            };
            expansions.push(child);
            allPlans.push(child);
            restore(beforeSnap);
          }
        }
        expansions.sort((a, b) => b.value - a.value);
        beam = expansions.slice(0, beamWidth);
        if (beam.length === 0) break;
      }

      restore(original);

      // 同首动作 → 取最佳后续。返回 top-5 个不同的首动作方案
      const byFirst = new Map();
      for (const node of allPlans) {
        if (!node.sequence[0]) continue;
        const key = actionUniqueKey(node.sequence[0]);
        if (!byFirst.has(key) || byFirst.get(key).value < node.value) {
          byFirst.set(key, node);
        }
      }

      return [...byFirst.values()]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(node => ({
          sequence: node.sequence,
          score: node.value,
          delta: node.value - initialValue,
          reason: `${node.sequence.map(actionLabel).join(" → ")}。${node.sequence.length} 步累计价值 +${Math.round(node.value - initialValue)}`,
          ok: true
        }));
    }

    function rankPlans(ruleSet = el("ruleSet").value) {
      return beamSearchPlans(ruleSet, { depth: 3, beamWidth: 5, actionCap: 15 });
    }
