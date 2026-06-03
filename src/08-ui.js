    // ---- render ----
    function gridScreen(r, c) {
      return {
        x: MAP.centerX + (c - r) * MAP.stepX,
        y: MAP.originY + (c + r) * MAP.stepY
      };
    }

    function cssPxVar(name, fallback) {
      if (typeof getComputedStyle !== "function" || !document.documentElement) return fallback;
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : fallback;
    }

    function boardLayout() {
      const cell = cssPxVar("--temple-cell", BOARD_LAYOUT.cell);
      const gap = cssPxVar("--temple-gap", BOARD_LAYOUT.gap);
      const border = cssPxVar("--temple-border", BOARD_LAYOUT.border);
      return { cell, gap, border, size: GRID_SIZE * cell + (GRID_SIZE - 1) * gap + border * 2 };
    }

    function cellCenterPx(pos) {
      const layout = boardLayout();
      return {
        x: layout.border + pos.col * (layout.cell + layout.gap) + layout.cell / 2,
        y: layout.border + pos.row * (layout.cell + layout.gap) + layout.cell / 2
      };
    }

    function atziriAnchorStyle() {
      const layout = boardLayout();
      const center = cellCenterPx(ATZIRI_TILE);
      const size = layout.cell;
      return [
        `left:${center.x - size / 2}px`,
        `top:${center.y - layout.cell / 2 - layout.gap - size}px`,
        `width:${size}px`,
        `height:${size}px`
      ].join(";");
    }

    function analyzeAndRender() {
      renderMap();
      renderMetrics();
      renderRouteInfo();
      renderRepairPanel();
      renderLabResults();
      renderCalibrationSummary();
      renderCalibrationRecorder();
      renderControls();
      renderHand();
      renderJson();
      renderNextStepAdvice();  // #104:实战 tab 动态下一步建议
      // 任务 8a:循环助手三列(道具 / 格子 / 清单)接进主渲染。仅 combat 视图渲染。
      // renderConnectionOverlay 已在 renderMap 末尾接入,这里不重复。
      if ((typeof document !== "undefined" && document.body
            ? document.body.getAttribute("data-active-view") || "combat"
            : "combat") === "combat") {
        try {
          window.__loopUI && window.__loopUI.renderStrategyOptions && window.__loopUI.renderStrategyOptions();
          window.__loopUI && window.__loopUI.renderInventory && window.__loopUI.renderInventory();
          window.__loopUI && window.__loopUI.renderChecklist && window.__loopUI.renderChecklist();
          window.__loopUI && window.__loopUI.renderProbePanel && window.__loopUI.renderProbePanel();
        } catch (e) { /* mock dom 下静默 */ }
      }
    }

    // 修复 #104:实战页 nextstep-bar 改成动态算法.
    // 不复用 recommendForGoal(那个文案太长,适合规划页).这个版本提炼 1-3 条具体动作.
    // 优先级:
    //   1. 手牌空 → 抽手牌
    //   2. 有未补 reward gap + 击杀过 architect → 提示放奖励房
    //   3. 模板缺口(content destroyed)+ hand 匹配 → 放 X 到 (r,c)
    //   4. 关庙累积 > 0 → close 结算(0.5 PN 已废锁牌防塌陷,删去原「暴露 HV → 贴锁」一步)
    //   5. fallback: 简短 checklist
    function computeCombatAdvice() {
      const lines = [];
      const tmpl = state.lastLoadedTemplate ? GOAL_TEMPLATES[state.lastLoadedTemplate] : null;

      // 1. 手牌
      if (!state.hand || state.hand.length === 0) {
        lines.push({ kind: "info", text: "抽 6 张手牌(关庙后会自动重抽,这次手动)" });
      }

      // 2/3/4 需要 reachable
      const { reachable } = totalScore();
      const reachSize = reachable.size;

      // 5. 关庙累积塌陷
      const pendingExit = state.pendingExitDestabilise || 0;
      let destroyedCount = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        if (state.tiles[r][c].destroyed) destroyedCount++;
      }
      const repair = computeRepairState();
      const topFragile = repair.fragile[0];
      const topRepair = repair.placements.find(p => p.relieved > 0 || p.connectedGain >= 3);
      const repairMode = destroyedCount > 0 || (state.destabiliseLog?.[0]?.picks?.length ?? 0) > 0;

      function playableRepairCard(pos) {
        if (!pos || !state.hand?.length) return null;
        const tile = tileAt(pos);
        if (!tile || (!tile.destroyed && tile.content !== "empty")) return null;
        for (let i = 0; i < state.hand.length; i++) {
          const cardId = state.hand[i];
          if (!cardId) continue;
          if (cardId !== "path" && !canPlaceRoom(pos, cardId).ok) continue;
          return { handIdx: i, cardId, label: cardId === "path" ? "通路" : (ROOM_TYPES[cardId]?.label || cardId) };
        }
        return null;
      }

      // 算缺口(若有模板)
      let firstContentGap = null;
      if (tmpl?.layoutSpec) {
        const gap = stateGapToTarget(tmpl);
        for (const g of gap.gaps) {
          if (g.missing !== "content" || !state.hand?.includes(g.want)) continue;
          // #106 Bug 1:还要检查目标格能放 — playCard 只接受 destroyed 或 empty,
          // 否则推了玩家点了执行不了(会显示"目标格已被占用").
          const tile = tileAt(g.pos);
          if (!tile) continue;
          if (!tile.destroyed && tile.content !== "empty") continue;
          // 防御:reward_locked 格也不能覆盖
          if (tile.reward_locked || tile.rewardLocked) continue;
          // #107 P1:还要校验 canPlaceRoom (链限制 notConnectableInChainWith 等),
          // 否则像 Spymaster 推到 commander 同链格,玩家点击会失败.path 跳过(无链限制).
          if (g.want !== "path") {
            const verdict = canPlaceRoom(g.pos, g.want);
            if (!verdict.ok) continue;
          }
          firstContentGap = g;
          break;
        }
        // 0.5 PN:锁牌不再防塌陷 — 删去「spec 想锁但未贴锁 → 提示贴锁」的暴露 HV 检测。
      }

      const playableTopRepair = topRepair ? playableRepairCard(topRepair.pos) : null;
      if (topRepair && topFragile && (repairMode || (playableTopRepair && topRepair.preventedLoss > 0))) {
        const cardText = playableTopRepair
          ? `打 <b>${playableTopRepair.label}</b>`
          : (state.hand?.length ? "当前手牌无合法抢修卡,保留补位" : "下一张可放过渡卡");
        lines.push({
          kind: repairMode ? "warn" : "action",
          text: `${cardText}先补 (${topRepair.pos.row},${topRepair.pos.col})`,
          reason: `抢修:解除 ${topRepair.relieved} 个唯一桥风险 · 降低低谷损失 ${topRepair.preventedLoss};当前最高危 ${topFragile.label}@(${topFragile.pos.row},${topFragile.pos.col}) 会牵连 ${topFragile.lostHighValue} 个高价值房`,
        });
      }

      if (firstContentGap) {
        const meta = ROOM_TYPES[firstContentGap.want];
        const label = meta?.label || firstContentGap.want;
        const role = tmpl.layoutSpec.find(s => s.row === firstContentGap.pos.row && s.col === firstContentGap.pos.col)?.role;
        lines.push({
          kind: "action",
          text: `放 <b>${label}</b> 到 (${firstContentGap.pos.row},${firstContentGap.pos.col})`,
          reason: `${role === "core" ? "模板核心缺口" : "模板诱饵缺口"} · 手牌可匹配`,
        });
      }

      if (pendingExit > 0) {
        lines.push({
          kind: "warn",
          text: `本次访问累积 <b>${pendingExit} 格</b>塌陷标记 — close 结算`,
          reason: `关庙才统一 resolve + 自动重抽下轮手牌`,
        });
      }

      if (!repairMode && lines.length < 3 && topFragile && topFragile.lostHighValue > 0) {
        lines.push({
          kind: "info",
          text: `拓扑体检:最高危 ${topFragile.label}@(${topFragile.pos.row},${topFragile.pos.col})`,
          reason: `若被命中会让 ${topFragile.lostReachable} 格掉线,其中高价值 ${topFragile.lostHighValue} 个;有空手时优先补闭环/支链`,
        });
      }

      if (lines.length < 3 && repair.placements.length && repair.placements[0].score > 0) {
        const p = repair.placements[0];
        lines.push({
          kind: "info",
          text: `稳态加固候选:补 (${p.pos.row},${p.pos.col})`,
          reason: `可解除 ${p.relieved} 个唯一桥风险 · 扩可达 ${p.connectedGain} 格`,
        });
      }

      // 5. 若都没动作,给状态摘要
      if (lines.length === 0) {
        if (tmpl) {
          lines.push({
            kind: "ok",
            text: `当前 <b>${tmpl.label || state.lastLoadedTemplate}</b>。reach ${reachSize}/81。无破损 / 无暴露。可继续打或 close.`
          });
        } else {
          lines.push({
            kind: "info",
            text: `自由编辑模式。reach ${reachSize}/81。可在 <b>战前预演</b> tab 载入模板做对照。`
          });
        }
      }

      // 顶上加一句"当前模式"提示
      const header = tmpl
        ? `当前: <b>${tmpl.label || state.lastLoadedTemplate}</b>`
        : `自由编辑(无模板)`;

      return { header, lines: lines.slice(0, 3) };
    }

    function renderNextStepAdvice() {
      // 找 nextstep-bar(只在实战 tab 显示)
      const bars = document.querySelectorAll(".nextstep-bar");
      if (!bars.length) return;
      const advice = computeCombatAdvice();
      const KIND_COLOR = {
        action: "var(--gold-glow)",
        warn: "#cb6358",
        ok: "var(--green)",
        info: "var(--gold-bright)",
      };
      const linesHtml = advice.lines.map(l => {
        const reasonHtml = l.reason
          ? `<div style="margin-left:14px;font-size:10px;color:var(--muted);font-family:'Microsoft YaHei',sans-serif">原因:${l.reason}</div>`
          : "";
        return `<div style="margin-top:3px;color:${KIND_COLOR[l.kind] || "var(--gold-bright)"}">→ ${l.text}</div>${reasonHtml}`;
      }).join("");
      bars.forEach(bar => {
        bar.innerHTML = `<div style="font-size:11px;color:var(--muted);margin-bottom:2px">${advice.header}</div>${linesHtml}`;
      });
    }

    function renderMap() {
      const map = el("map");
      const { reachable, powered, amplified } = totalScore();
      const chain = buildChain();
      const chainSet = new Set(chain);
      state.chain = chain;
      const colorMap = computeColorMap();
      const repair = computeRepairState();
      const fragileSet = new Set(repair.fragile.slice(0, 3).map(f => f.key));
      const repairSet = new Set(repair.placements.slice(0, 2).map(p => tileKey(p.pos)));

      let tilesHtml = "";
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const pos = { row: r, col: c };
          const key = tileKey(pos);
          const tile = tileAt(pos);
          const selected = state.selected === key;
          const renderTile = tile.destroyed ? { ...tile, content: "empty" } : tile;
          const meta = (renderTile.content !== "empty" && renderTile.content !== "path") ? ROOM_TYPES[renderTile.content] : null;
          const isPath = renderTile.content === "path";

          const cls = ["tile"];
          if (selected) cls.push("selected");
          if (tile.destroyed) cls.push("destroyed");
          if (isPath) cls.push("path-content");
          if (r === ATZIRI_TILE.row && c === ATZIRI_TILE.col && renderTile.content !== "empty") cls.push("atziri-connector");
          if (meta) {
            cls.push("named");
            if (meta.needsPower && hasRequiredPower(pos, powered)) cls.push("powered");
            if (meta.needsPower && !hasRequiredPower(pos, powered)) cls.push("unpowered");
            if (amplified.has(key)) cls.push("amplified");
            if (renderTile.content === "architect_chamber") cls.push("architect");
            if (renderTile.content === "atziri_chamber") cls.push("atziri");
            cls.push(`kind-${meta.kind}`);
          }
          if (chainSet.has(key)) cls.push("chain");
          else if (reachable.has(key)) cls.push("reachable");
          else if (meta) cls.push("locked");
          if (fragileSet.has(key)) cls.push("repair-fragile");
          if (repairSet.has(key)) cls.push("repair-candidate");
          // chunk 融合 — 与邻居非空时去对应边框
          if ((meta || isPath) && !tile.destroyed) {
            const fuse = tileFuseSides(pos);
            if (fuse.n) cls.push("fuse-n");
            if (fuse.s) cls.push("fuse-s");
            if (fuse.e) cls.push("fuse-e");
            if (fuse.w) cls.push("fuse-w");
          }
          // 连接器 stub — 朝 right/down 邻居有 canConnect 时画
          if ((meta || isPath) && !tile.destroyed) {
            if (c + 1 < GRID_SIZE && canConnect(pos, { row: r, col: c + 1 })) cls.push("conn-right");
            if (r + 1 < GRID_SIZE && canConnect(pos, { row: r + 1, col: c })) cls.push("conn-down");
          }

          let inner = "";
          let title = `${r},${c}`;
          if (meta) {
            const iconPath = ROOM_ICON_PATHS[renderTile.content];
            const iconHtml = iconPath
              ? `<img class="room-icon" src="${iconPath}" alt="${meta.label}">`
              : `<div class="room-glyph">${ROOM_GLYPHS[renderTile.content] ?? ""}</div>`;
            const tierStr = renderTile.tier > 0 ? (ROMAN_TIER[renderTile.tier] ?? `T${renderTile.tier}`) : "";
            const tierHtml = tierStr ? `<div class="tier-badge">${tierStr}</div>` : "";
            const medIconPath = tile.medallion ? MEDALLION_ICON_PATHS[tile.medallion] : null;
            const medHtml = tile.medallion
              ? (medIconPath
                  ? `<img class="medallion-mark" src="${medIconPath}" alt="${MEDALLION_LABEL[tile.medallion]}" title="${MEDALLION_LABEL[tile.medallion]}">`
                  : `<div class="medallion-mark" style="background:#3a2c18;color:var(--gold-glow);border-radius:50%;font-size:8px;line-height:14px;text-align:center;" title="${MEDALLION_LABEL[tile.medallion]}">${MEDALLION_SHORT[tile.medallion] ?? '·'}</div>`)
              : "";
            const powerHtml = meta.needsPower ? `<div class="power-mark" title="${hasRequiredPower(pos, powered) ? '已供能' : '未供能'}">⚡</div>` : "";
            const modsHtml = tile.mods > 0 ? `<div class="mods-mark" title="强化 × ${tile.mods}">+${tile.mods}</div>` : "";
            const tierName = meta.tierChain && meta.tierChain[renderTile.tier] ? ` · ${meta.tierChain[renderTile.tier]}` : "";
            const value = Math.round(roomValue(pos));
            const ampMult = amplified.get(key);
            title = `${r},${c} · ${meta.label}${tierStr ? ' ' + tierStr : ''}${tierName} · 规划基值 ${value}${ampMult ? ` × ${ampMult.toFixed(2)}` : ''}${tile.mods ? ` · 强化+${tile.mods}` : ''}`;
            inner = `<div class="tile-inner">${iconHtml}<div class="room-name">${meta.label}</div>${tierHtml}${medHtml}${powerHtml}${modsHtml}</div>`;
          } else if (isPath) {
            const isFoyer = isFoyerTile(pos);
            if (isFoyer) {
              cls.push("foyer-cell");
              inner = `<div class="tile-inner"><div class="path-dot"></div></div>`;
              title = `${r},${c} · 入口(永久锁定)`;
            } else {
              const onChain = chainSet.has(key);
              // round s.7: 检测"等清 path" — 当前 goal spec 期望 named 但这里是 path,
              //   通常是 cut vertex 降级 或 玩家临时占位。玩家不能直接覆盖,要等下次塌陷清。
              const currentGoal = state.goalRecommendation ? GOAL_TEMPLATES[state.goalRecommendation.targetId] : null;
              const specWant = currentGoal?.layoutSpec?.find(s => s.row === r && s.col === c);
              const isWaitingClear = specWant && specWant.content !== "path";
              if (isWaitingClear) cls.push("path-waiting-clear");
              const warnMark = isWaitingClear ? '<div class="wait-clear-mark" style="position:absolute;top:2px;right:2px;color:#daa520;font-size:14px;text-shadow:0 0 4px #000;font-weight:bold;pointer-events:none" title="等清 — spec 期望 ' + (ROOM_TYPES[specWant.content]?.label ?? specWant.content) + ',须等下次塌陷再放">⚠</div>' : '';
              inner = `<div class="tile-inner"><div class="path-dot${onChain ? ' chain-dot' : ''}"></div>${warnMark}</div>`;
              title = isWaitingClear
                ? `${r},${c} · 通路 ⚠ 等清(spec 期望 ${ROOM_TYPES[specWant.content]?.label ?? specWant.content},须等塌陷清除后再放)`
                : `${r},${c} · 通路`;
            }
          } else {
            title = `${r},${c} · ${tile.destroyed ? "已销毁(空格)" : "空格"}`;
          }

          const colorAttr = colorMap.has(key) && !(isPath && isFoyerTile(pos)) ? ` data-path-color="${colorMap.get(key)}"` : "";
          tilesHtml += `<div class="${cls.join(' ')}" data-row="${r}" data-col="${c}" title="${title}"${colorAttr}>${inner}</div>`;
        }
      }

      const foyerSelected = state.selected === "foyer";
      const atziriSelected = state.selected === "atziri";
      const atzReach = atziriReachable();
      const atziriTileObj = tileAt(ATZIRI_TILE);
      const atziriConnectedTile = atziriTileObj && !atziriTileObj.destroyed && atziriTileObj.content !== "empty";
      const foyerLine = "";
      const atziriLine = "";
      const atziriActiveCls = atzReach ? " connected" : "";
      // 本地坐标模型:Foyer 是 cell (8,4) 内的 locked path,没有独立 anchor
      const foyerHtml = "";
      const atziriHtml = `<div class="atziri-anchor${atziriSelected ? ' selected' : ''}${atzReach ? ' reachable' : ' locked'}${atziriActiveCls}" style="${atziriAnchorStyle()}" data-special="atziri" title="阿兹里殿堂(网格外固定,连接 ${ATZIRI_TILE.row},${ATZIRI_TILE.col} 格)"><img src="${ROOM_ICON_PATHS.atziri_chamber}" alt="阿兹里殿堂"><div class="label">阿兹里殿堂</div></div>`;

      const cornerSvg = `<svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
        <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
        <polygon points="40,16 46,40 40,64 34,40" fill="currentColor" opacity="0.7"/>
        <polygon points="16,40 40,34 64,40 40,46" fill="currentColor" opacity="0.5"/>
        <path d="M40 8 L48 20 L56 8" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <path d="M8 40 L20 48 L8 56" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <circle cx="40" cy="40" r="3" fill="currentColor"/>
      </svg>`;
      const corners = `<div class="corner-deco tl">${cornerSvg}</div><div class="corner-deco tr">${cornerSvg}</div><div class="corner-deco bl">${cornerSvg}</div><div class="corner-deco br">${cornerSvg}</div>`;
      map.innerHTML = corners + `<div class="temple-board"><div class="temple-grid-wrap"><div class="temple-grid">${tilesHtml}</div>${foyerLine}${atziriLine}${foyerHtml}${atziriHtml}</div></div>`;
      window.__loopUI && window.__loopUI.renderConnectionOverlay && window.__loopUI.renderConnectionOverlay();

      map.querySelectorAll(".tile, .foyer-anchor, .atziri-anchor").forEach(node => {
        node.addEventListener("click", () => {
          // 任务 8b-2:标记模式下,无条件吞掉点击 —— 有 row/col 的格子循环塌陷标记,
          // 锚点(阿兹里/foyer,无 data-row)直接 return,绝不走选格/renderMap,
          // 否则会重渲染抹掉已标记格的 mark-collapsed/mark-downgraded 高亮。
          if (window.__loopUI && window.__loopUI.markMode) {
            if (node.dataset && node.dataset.row != null) {
              window.__loopUI.cycleMark({ row: Number(node.dataset.row), col: Number(node.dataset.col) });
            }
            return;
          }
          if (node.dataset.special === "foyer") state.selected = "foyer";
          else if (node.dataset.special === "atziri") state.selected = "atziri";
          else if (node.dataset.row != null) {
            state.selected = tileKey({ row: Number(node.dataset.row), col: Number(node.dataset.col) });
          }
          renderControls();
          renderMap();
        });
        if (node.dataset.row == null) return;
        node.addEventListener("dragover", (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          node.classList.add("drop-target");
        });
        node.addEventListener("dragleave", () => node.classList.remove("drop-target"));
        node.addEventListener("drop", (e) => {
          e.preventDefault();
          node.classList.remove("drop-target");
          const idxStr = e.dataTransfer.getData("text/handIdx") || e.dataTransfer.getData("text");
          const idx = Number(idxStr);
          if (Number.isNaN(idx) || idx < 0) return;
          const pos = { row: Number(node.dataset.row), col: Number(node.dataset.col) };
          state.selected = tileKey(pos);
          playCard(idx, pos);
          analyzeAndRender();
        });
      });
    }

    function renderMetrics() {
      const cur = totalScore("0.5");
      const old = totalScore("0.4");
      let highValue = 0, destroyedCount = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const tile = tileAt({ row: r, col: c });
        if (tile.destroyed) destroyedCount++;
        if (!tile.destroyed && cur.reachable.has(tileKey({ row: r, col: c })) && roomValue({ row: r, col: c }) >= 12) highValue++;
      }
      const chainTag = state.chainStrict ? "严格" : "非严格";
      const pool = state.medallionPool;
      // 修复 P3:显示全 9 种纹章(MEDALLION_SHORT 顺序),不再缺 azcapa/xopec
      const poolStr = MEDALLION_TYPES.map(t => `${MEDALLION_SHORT[t] ?? t[0]}${pool[t] ?? 0}`).join(" ");
      const waystoneStr = (state.waystoneModCount ?? 0) > 0 ? ` · Waystone 词条 ${state.waystoneModCount}/8` : "";
      const lootMultStr = `×${(cur.lootMult ?? 1).toFixed(2)}`;
      const lb = computeLimbBuffer(cur.reachable);
      const bufferStr = lb.maxHVDist >= 0 ? `${lb.buffer}格 (高价值距入口=${lb.maxHVDist})` : "无高价值房";
      const rh = computeRingHealth(cur.reachable);
      const ringStr = `${rh.nonCutCount} / ${rh.cutCount}`;
      const hvRingStr = `${rh.hvOnRing} / ${rh.hvOnChain}`;
      // 词条键 → 中文简称
      const STAT_LABEL = {
        chest_item_rarity: "藏宝稀有度",
        item_rarity: "怪物掉落稀有度",
        gold: "金币",
        rare_chests: "稀有宝箱",
        rare_extra_mod_chance: "稀有怪附加词条",
        experience: "经验",
        pack_size: "怪群数量",
        humanoid_effectiveness: "类人增益",
        construct_effectiveness: "构装增益",
        rare_effectiveness: "稀有怪增益",
        unique_effectiveness: "传奇怪增益",
        normal_monster_effectiveness: "普通怪增益",
        magic_monster_count: "魔法怪数量",
        rare_monster_count: "稀有怪数量",
        mod_amp_lab_family: "实验室家族放大",
        mod_amp_combat_family: "战斗家族放大",
        mod_amp_magic_family: "魔法家族放大"
      };
      const topStats = cur.stack
        ? [...cur.stack.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([k, v]) => `${STAT_LABEL[k] ?? k} +${Math.round(v * 100)}%`)
            .join("  ")
        : "";
      // 校准相关指标(实际推荐 tab 优先显示)
      const PLAN_LABEL = {
        "probe-calibration": "Probe 校准",
        "core-shell-cycle": "Plan A",
        "plan-a-b2-hybrid": "链尾专用",
        "pn05-chain-safe": "链尾稳健",
        "core-shell-plan-b": "旧 Plan B",
      };
      const currentPlan = PLAN_LABEL[state.lastLoadedTemplate] || (state.lastLoadedTemplate ? "baseline" : "手动");
      const cal = state.calibrationSummary;
      const calRec = cal?.recommendation;
      const calStatus = calRec?.status || "待实测";
      const calHint = calRec?.template_label || calRec?.next_action || "跑 analyze_observations.py 后定";
      const reachSize = cur.reachable.size;
      const expectedDestab = Math.max(1, Math.floor(reachSize * 0.10));
      // Atziri 通路风险
      let atziriRisk = "安全";
      try {
        if (typeof atziriReachable === "function" && atziriReachable()) atziriRisk = "⚠ 已通!";
      } catch (e) {}

      // 主 tab 默认指标(校准 + 必要状态)
      const mainMetrics = [
        ["当前方案", currentPlan, state.lastLoadedTemplate === "probe-calibration" ? "0.5 校准开局" :
          (state.lastLoadedTemplate === "core-shell-cycle" ? "random/weighted validated" :
          (state.lastLoadedTemplate === "plan-a-b2-hybrid" ? "chain-end special candidate" :
          (state.lastLoadedTemplate === "pn05-chain-safe" ? "chain-end robust candidate" :
          (state.lastLoadedTemplate === "core-shell-plan-b" ? "旧 chain-end 对照" : "手动编辑"))))],
        ["校准状态", calStatus, calHint],
        ["close 前预计塌陷", `${expectedDestab} 格`, `10% × reach(${reachSize})`],
        ["Atziri 通路", atziriRisk, "循环策略下应保持安全"],
        ["可达 / 销毁", `${reachSize} / ${destroyedCount}`, `共 ${GRID_SIZE * GRID_SIZE} 格`],
        ["纹章池", poolStr, `贴 ${countMedallions()} · 放大 ${cur.amplified.size}${waystoneStr}`],
        [
          "本次访问累积",
          `${state.pendingExitDestabilise ?? 0} 格`,
          `${state.pendingExitDestabilise > 0 ? "关庙时塌陷" : "未累积"}${state.pendingRoyalAccessDestruction ? " · Royal Access 待摧毁" : ""}${state.pendingArchitectRespawn ? " · 建筑师待重生" : ""}${state.pendingAssassinateUpgrade ? " · Spymaster 待升级" : ""}`
        ],
      ];
      // 研究指标(仅 lab tab 显示,跟在主指标后)
      const labMetrics = [
        ["规划分", Math.round(cur.score), `收益倍率 ${lootMultStr} · 宝库 ${Math.round(cur.vaults ?? 0)}`],
        ["新旧差", Math.round(cur.score - old.score), "负数 = 蛇形在 0.5 失血"],
        [`链 · ${chainTag}`, state.chain.length, state.chainStrict ? "单进单出蛇形" : "存在分叉"],
        ["环 / 链格", ringStr, "非断链 / 断链"],
        ["高价值在环 / 链", hvRingStr, "高价值房在环上 / 在链上"],
        ["支链缓冲", bufferStr, "高价值边界之外可吸塌陷的格子"],
        ["最强词条", topStats || "—", "本布局加成最高的 2 个词条"],
      ];
      // 修复 #103:tab 从 main/lab 改为 combat/premortem/calibration.
      // 战前预演 + 校准 显示完整指标(含研究指标);实战只显示主指标(简洁副驾驶).
      const activeView = (typeof document !== "undefined" && document.body)
        ? document.body.getAttribute("data-active-view") || "combat"
        : "combat";
      const showLabExtras = activeView === "premortem" || activeView === "calibration";
      const data = showLabExtras ? [...mainMetrics, ...labMetrics] : mainMetrics;
      el("metrics").innerHTML = data.map(([n, v, h]) => `<div class="metric"><b>${v}</b><span>${n} · ${h}</span></div>`).join("");
    }

    function calibrationTemplateForStatus(status) {
      if (status === "PLAN_A") return "core-shell-cycle";
      if (status === "CHAIN_END" || status === "PLAN_B") return "plan-a-b2-hybrid";
      return null;
    }

    // 从 mode_posterior 找最高项 = 塌陷算法判定. 返回 {mode, prob} 或 null.
    function topModeFromPosterior(posterior) {
      if (!posterior) return null;
      const entries = Object.entries(posterior).filter(([, v]) => typeof v === "number");
      if (!entries.length) return null;
      const [mode, prob] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
      return { mode, prob };
    }

    const COLLAPSE_MODE_LABEL = {
      random: "random(平均散布)",
      weighted: "weighted(越远越容易塌)",
      "chain-end": "chain-end(只啃最远端)",
    };

    // cut_vertex / lock 行为卡:engine 没样本时返回 {n:0, note},有样本时返回 ratio_*.
    function renderCutVertexCard(cv) {
      if (!cv || (cv.n === 0)) {
        return `<div class="item">
          <strong>断点(cut vertex)行为</strong>
          <p style="color:var(--muted);font-size:11px">${(cv && cv.note) || "还没记到断点塌陷样本"}</p>
        </div>`;
      }
      const n = cv.n_cut_vertex_hits ?? 0;
      const dg = cv.ratio_downgrade ?? 0, sk = cv.ratio_skip ?? 0, rm = cv.ratio_remove ?? 0;
      let verdict = "混合", cls = "";
      if (dg >= 0.6) { verdict = "降级(0.5 行为)"; cls = "good"; }
      else if (sk >= 0.6) { verdict = "跳过(0.4 老行为)"; }
      else if (rm >= 0.6) { verdict = "直接拆(会断链!)"; cls = "warning"; }
      return `<div class="item ${cls}">
        <strong>断点(cut vertex)行为</strong>
        <p><b>${verdict}</b> · ${n} 次命中</p>
        <p style="color:var(--muted);font-size:11px">降级 ${Math.round(dg * 100)}% · 跳过 ${Math.round(sk * 100)}% · 拆除 ${Math.round(rm * 100)}%</p>
      </div>`;
    }

    function renderLockCard(lk) {
      if (!lk || (lk.n === 0)) {
        return `<div class="item">
          <strong>锁牌(Juatalotli)行为</strong>
          <p style="color:var(--muted);font-size:11px">${(lk && lk.note) || "还没记到锁牌格塌陷样本"}</p>
        </div>`;
      }
      const n = lk.n_locked_hits ?? 0;
      const sk = lk.ratio_skip ?? 0, rd = lk.ratio_remove_or_downgrade ?? 0;
      let verdict = "混合", cls = "";
      if (sk >= 0.6) { verdict = "真挡住(跳过)"; cls = "good"; }
      else if (rd >= 0.6) { verdict = "没挡住(照拆/降)"; cls = "warning"; }
      return `<div class="item ${cls}">
        <strong>锁牌(Juatalotli)行为</strong>
        <p><b>${verdict}</b> · ${n} 次命中</p>
        <p style="color:var(--muted);font-size:11px">跳过 ${Math.round(sk * 100)}% · 拆或降 ${Math.round(rd * 100)}%</p>
      </div>`;
    }

    function renderCalibrationSummary() {
      const root = el("calibrationSummary");
      if (!root) return;
      const cal = state.calibrationSummary;
      if (!cal) {
        root.innerHTML = `
          <div class="item">
            <strong>当前 posterior</strong>
            <p style="font-family:Consolas,monospace">P(random) = ? · P(weighted) = ? · P(chain-end) = ?</p>
            <p style="color:var(--muted);font-size:11px">先跑 <code>python sim/analyze_observations.py</code>,再点“读取校准结果”。</p>
          </div>
          <div class="item">
            <strong>校准结论</strong>
            <p>等数据。random/weighted → Plan A; chain-end → 链尾专用。</p>
          </div>`;
        return;
      }
      const p = cal.mode_posterior || {};
      const rec = cal.recommendation || {};
      const top = topModeFromPosterior(p);
      const verdictLine = top
        ? `判定:<b>${COLLAPSE_MODE_LABEL[top.mode] || top.mode}</b>(P=${top.prob})`
        : "判定:样本不足";
      const templateId = rec.template_id || calibrationTemplateForStatus(rec.status);
      const canLoad = templateId && GOAL_TEMPLATES[templateId];
      const button = canLoad
        ? `<button id="loadCalibrationRecommendation" class="primary" style="margin-top:8px">加载推荐方案</button>`
        : "";
      const planTemplateLabel = rec.template_label
        || (templateId === "core-shell-cycle" ? "Plan A 核心堡垒"
          : templateId === "plan-a-b2-hybrid" ? "链尾专用 Plan A+b2"
          : null);
      const planHint = planTemplateLabel
        ? `推荐切:<b>${planTemplateLabel}</b>`
        : "Plan 间还没定,继续记观测";
      root.innerHTML = `
        <div class="item ${rec.status === "PLAN_A" || rec.status === "CHAIN_END" ? "good" : ""}">
          <strong>塌陷算法判定</strong>
          <p>${verdictLine}</p>
          <p style="font-family:Consolas,monospace">P(random) = ${p.random ?? "?"} · P(weighted) = ${p.weighted ?? "?"} · P(chain-end) = ${p["chain-end"] ?? "?"}</p>
          <p style="color:var(--muted);font-size:11px">样本 ${cal.n_observations ?? 0} · dmax ${cal.dmax_obs ?? "?"} · path 命中 ${cal.path_hit_rate != null ? Math.round(cal.path_hit_rate * 100) + "%" : "—"} · 来源 ${cal.source_name || "calibration-summary.json"}</p>
        </div>
        ${renderCutVertexCard(cal.cut_vertex_behavior)}
        ${renderLockCard(cal.lock_behavior)}
        <div class="item">
          <strong>校准结论</strong>
          <p><b>${rec.status || "PENDING"}</b> · ${rec.message || "继续记录观测"}</p>
          <p style="color:var(--muted);font-size:12px">${planHint}</p>
          <p style="color:var(--muted);font-size:11px">${rec.next_action || ""}</p>
          ${button}
        </div>`;
      el("loadCalibrationRecommendation")?.addEventListener("click", () => {
        if (templateId) loadTemplateById(templateId);
      });
    }

    const CALIBRATION_CSV_HEADER = "visit,rule_event,reach_before,target_row,target_col,distance_from_foyer,content,tier,is_path,is_cut_vertex,has_lock,result,notes";

    function csvEscape(value) {
      const s = String(value ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }

    function calibrationObservationFromSelected() {
      const pos = selectedPos();
      if (!pos) return null;
      const tile = tileAt(pos);
      if (!tile) return null;
      const reachable = reachableFromFoyer();
      const key = tileKey(pos);
      const dist = tileChainDistance();
      return {
        visit: Number(el("calibrationVisit")?.value || 1),
        rule_event: el("calibrationEvent")?.value || "close",
        reach_before: reachable.size,
        target_row: pos.row,
        target_col: pos.col,
        distance_from_foyer: dist.get(key) ?? "",
        content: tile.destroyed ? "empty" : tile.content,
        tier: tile.destroyed ? 0 : (tile.tier ?? 0),
        is_path: !tile.destroyed && tile.content === "path",
        is_cut_vertex: reachable.has(key) ? wouldDisconnect(pos, reachable) : false,
        has_lock: tile.medallion === "juatalotli",
        result: el("calibrationResult")?.value || "remove",
        notes: el("calibrationNotes")?.value || "",
      };
    }

    function calibrationRowToCsv(row) {
      return [
        row.visit, row.rule_event, row.reach_before, row.target_row, row.target_col,
        row.distance_from_foyer, row.content, row.tier,
        row.is_path ? "true" : "false",
        row.is_cut_vertex ? "true" : "false",
        row.has_lock ? "true" : "false",
        row.result, row.notes,
      ].map(csvEscape).join(",");
    }

    function calibrationCsvText(includeHeader = true) {
      const rows = state.calibrationRows || [];
      const lines = rows.map(calibrationRowToCsv);
      return includeHeader ? [CALIBRATION_CSV_HEADER, ...lines].join("\n") : lines.join("\n");
    }

    function renderCalibrationRecorder() {
      const root = el("calibrationRecorder");
      if (!root) return;
      const current = calibrationObservationFromSelected();
      const currentLine = current ? calibrationRowToCsv(current) : "";
      const rows = state.calibrationRows || [];
      root.innerHTML = `
        <div class="item">
          <strong>当前选中格生成行</strong>
          <p style="font-family:Consolas,monospace;font-size:10px;word-break:break-all">${currentLine || "先在中间棋盘点一个塌陷格"}</p>
        </div>
        <div class="item">
          <strong>暂存观测</strong>
          <p>${rows.length} 行</p>
          <textarea id="calibrationCsvPreview" style="min-height:120px">${calibrationCsvText(true)}</textarea>
        </div>`;
    }

    function countMedallions() {
      let n = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        if (state.tiles[r][c].medallion) n++;
      }
      return n;
    }

    function renderRouteInfo() {
      const entries = [];
      entries.push(`<div class="item warning"><strong>赛季校准状态</strong><p>0.4 wiki 数据可信(多轮交叉验证)。0.5 PN 节选 5 条已应用(塌陷规则、T4 解锁、Vaal Infuser 拆分、上限自动、Reward Room 改进)。塌陷数值同 0.4 待 5-29 上线实测。<b>规划分不是市场收益</b>,房间价值等级仍是占位。</p></div>`);
      const actions = recommendActions();
      if (actions.length) {
        entries.push(...actions.map(a => `<div class="item ${a.kind}"><strong>${a.title}</strong><p>${a.body}</p></div>`));
      }
      const atzReach = atziriReachable();
      entries.push(`<div class="item"><strong>阿兹里路线</strong><p>${atzReach ? "已连通(入口 → ... → 阿兹里殿堂)" : "未连通。需要在阿兹里殿堂相邻格 (0,4) 放路径并打通到入口邻接格 (8,4)"}</p></div>`);
      if (state.destabiliseLog.length) {
        const last = state.destabiliseLog[0];
        const desc = last.applied ? last.picks.map(p => `${p.key}(${p.mode === "downgrade" ? "塌陷为通路" : "移除"})`).join("、") : "本轮无房可塌陷(末端可能全部锁定纹章)";
        entries.push(`<div class="item"><strong>上次塌陷 [${last.ruleSet}] ${last.applied}/${last.requested}</strong><p>${desc}</p></div>`);
      }
      el("routeInfo").innerHTML = entries.join("");
    }

    function repairModeLabel(repair) {
      const destroyed = (() => {
        let n = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          if (state.tiles[r][c].destroyed) n++;
        }
        return n;
      })();
      if (destroyed > 0) return { label: "抢修中", cls: "warning", detail: `${destroyed} 格已空,先解除唯一桥` };
      if (repair.fragile.some(f => f.lostHighValue > 0)) return { label: "脆弱", cls: "warning", detail: "存在高价值下游单点" };
      if (repair.fragile.length) return { label: "可加固", cls: "", detail: "有低收益单点,不急" };
      return { label: "稳定", cls: "good", detail: "暂无可塌陷唯一桥" };
    }

    function renderRepairPanel() {
      const node = document.getElementById("repairPanel");
      if (!node) return;
      const repair = computeRepairState();
      const mode = repairModeLabel(repair);
      const worst = repair.fragile[0];
      const best = repair.placements[0];
      const totalAtRisk = repair.fragile.reduce((sum, f) => sum + Math.max(0, f.lostValue), 0);
      const duty = repair.dutyCycle || { steadyValue: repair.totalValue, peakValue: repair.totalValue, valleyValue: repair.totalValue, valleyLoss: 0, recoveryTurns: 0 };
      const statHtml = `
        <div class="repair-head">
          <div class="repair-stat"><b>${mode.label}</b><span>${mode.detail}</span></div>
          <div class="repair-stat"><b>${repair.fragile.length}</b><span>唯一桥 / 割点风险</span></div>
          <div class="repair-stat"><b>${duty.steadyValue}</b><span>时间加权稳态估值</span></div>
        </div>`;

      const topHtml = worst
        ? `<div class="item ${mode.cls}">
            <strong>最高危点: ${worst.label} @ (${worst.pos.row},${worst.pos.col})</strong>
            <p>若被命中,预计 ${worst.lostReachable} 格掉线,高价值 ${worst.lostHighValue} 个,收益损失约 ${worst.lostValue}。当前峰值 ${duty.peakValue},低谷 ${duty.valleyValue},恢复约 ${duty.recoveryTurns} 步。</p>
          </div>`
        : `<div class="item good"><strong>拓扑稳定</strong><p>当前可达图里没有普通塌陷可命中的唯一桥。继续按收益 / 纹章节奏推进。</p></div>`;

      const repairHtml = best
        ? `<div class="item good">
            <strong>推荐抢修 / 加固:补 (${best.pos.row},${best.pos.col})</strong>
            <p>预计解除 ${best.relieved} 个唯一桥风险,新接回 ${best.connectedGain} 格,减少低谷损失 ${best.preventedLoss},稳态 +${best.steadyGain}。用任意可合法放置的过渡卡优先闭环。</p>
          </div>`
        : `<div class="item"><strong>暂无补位候选</strong><p>当前没有邻接可达空格能立刻解除唯一桥。先扩可达区或等待塌陷清出位置。</p></div>`;

      const rows = repair.fragile.slice(0, 5).map(f => `
        <tr>
          <td><span class="repair-tag">${f.pos.row},${f.pos.col}</span></td>
          <td>${f.label}${f.tier ? ` T${f.tier}` : ""}</td>
          <td>${f.lostReachable}</td>
          <td>${f.lostHighValue}</td>
          <td>${f.lostValue}</td>
        </tr>`).join("");
      const tableHtml = rows
        ? `<table class="repair-table">
            <thead><tr><th>位置</th><th>房间</th><th>掉线</th><th>高价值</th><th>损失</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
        : "";
      const dutyHtml = `<div class="item">
        <strong>时间加权收益</strong>
        <p>稳态估值 = (${duty.peakTurns} × ${duty.peakValue} + ${duty.recoveryTurns} × ${duty.valleyValue}) / ${duty.peakTurns + duty.recoveryTurns} = <b>${duty.steadyValue}</b>。风险总暴露 ${totalAtRisk}。</p>
      </div>`;

      node.innerHTML = `${statHtml}${topHtml}${repairHtml}${dutyHtml}${tableHtml}`;
    }

    // 实验 / 规划 结果面板渲染(viewLab)
    function renderLabResults() {
      const node = document.getElementById("labResults");
      if (!node) return;
      const entries = [];
      const EXIT_LABEL = { close: "关闭神庙", architect: "建筑师击杀", atziri: "阿兹里击杀" };
      // #105 模拟当前布局结果(独立 state.currentLayoutSim,显示在最顶)
      if (state.currentLayoutSim) {
        const r = state.currentLayoutSim;
        entries.push(`<div class="item good">
          <strong>模拟当前布局 — ${r.mode} mode × ${r.rounds} 回合 × ${r.trials} trials</strong>
          <p style="font-family:Consolas,monospace;font-size:11px;line-height:1.6">
            loot×&nbsp; mean ${r.lootMult.mean.toFixed(2)} · p10 ${r.lootMult.p10.toFixed(2)} · p50 ${r.lootMult.p50.toFixed(2)} · p90 ${r.lootMult.p90.toFixed(2)}<br>
            value&nbsp; mean ${r.value.mean.toFixed(1)} · p10 ${r.value.p10.toFixed(1)} · p90 ${r.value.p90.toFixed(1)}<br>
            reach&nbsp; mean ${r.reach.mean.toFixed(1)} · HV mean ${r.hv.mean.toFixed(1)}
          </p>
          <p style="color:var(--muted);font-size:10px">基于当前 state.tiles 跑 MC,不污染实战日志.</p>
        </div>`);
      }
      if (state.snakeComparison) {
        const r = state.snakeComparison;
        const o = r.opts || {};
        const seqParts = [];
        if (o.enter) seqParts.push("进入");
        if (o.architect) seqParts.push("建筑师");
        if (o.atziri) seqParts.push("阿兹里");
        if (o.closeReps) seqParts.push(`${o.closeReps} × 关闭`);
        const seqText = seqParts.length ? seqParts.join(" + ") : "(无事件)";
        entries.push(`<div class="item"><strong>蛇形塌陷对比 · ${o.medallions ?? 3} 纹章 + ${seqText}</strong><p><b>0.4 旧规</b>:存活高价值 ${r["0.4"].highValueAlive} (起始 ${r["0.4"].initialHighValue}),销毁 ${r["0.4"].removed},塌陷 / 降级 ${r["0.4"].downgraded},可达 ${r["0.4"].finalReachable} / ${r["0.4"].initialReachable}<br><b>0.5 新规</b>:存活高价值 ${r["0.5"].highValueAlive} (起始 ${r["0.5"].initialHighValue}),销毁 ${r["0.5"].removed},塌陷 / 降级 ${r["0.5"].downgraded},可达 ${r["0.5"].finalReachable} / ${r["0.5"].initialReachable}</p></div>`);
      }
      if (state.snakeComparisonMC) {
        const r = state.snakeComparisonMC;
        const fmt = (st) => `${st.mean.toFixed(2)} ± ${st.stddev.toFixed(2)} [10 分位=${st.p10} · 中位=${st.p50} · 90 分位=${st.p90}]`;
        entries.push(`<div class="item warning"><strong>统计模拟 × ${r.trials} 次 蛇形稳定性(均匀随机塌陷)</strong><p><b>0.4</b>:存活高价值 ${fmt(r["0.4"].highValueAlive)} · 降级 ${fmt(r["0.4"].downgraded)} · 销毁 ${fmt(r["0.4"].removed)}<br><b>0.5</b>:存活高价值 ${fmt(r["0.5"].highValueAlive)} · 降级 ${fmt(r["0.5"].downgraded)} · 销毁 ${fmt(r["0.5"].removed)}<br>均匀随机模式假设游戏内塌陷选目标是均匀随机;若实际是末端优先(等 0.5 实测),结果会更对蛇友好。</p></div>`);
      }
      if (state.strategyCompareResult) {
        const r = state.strategyCompareResult;
        const fmt = (st) => `${st.mean.toFixed(2)} ± ${st.stddev.toFixed(2)} (最大=${st.max})`;
        entries.push(`<div class="item good"><strong>3 策略对比 · ${r.trials} 次模拟 · ${r.closeReps} × 关闭 · 支链长 = ${r.limbLength}</strong><p><b>直链蛇形</b>:终态高价值 ${fmt(r.straight)}<br><b>直链 + 支链(无修复)</b>:终态高价值 ${fmt(r.limb)}<br><b>直链 + 支链 + 修复</b>:终态高价值 ${fmt(r.limbRepair)}<br>支链 + 修复在末端优先塌陷模式下能保全高价值房,在均匀随机模式下仍优于直链但优势缩小。</p></div>`);
      }
      if (state.pythonImportResult) {
        const r = state.pythonImportResult;
        const paramsStr = Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(", ");
        entries.push(`<div class="item good"><strong>Python sweep 最优变体已加载</strong><p>${r.label}</p><p style="margin-top:6px"><b>参数</b>: ${paramsStr}</p><p style="margin-top:6px"><b>模式</b>: ${r.mode} · <b>来源</b>: ${r.source ?? "n/a"}</p><p style="margin-top:6px"><b>lootMult</b>: mean ${r.loot.mean} · p10 ${r.loot.p10} · p50 ${r.loot.p50} · p90 ${r.loot.p90} · 风险调整 ${r.loot.risk_adj}</p><p><b>HV 存活</b>: mean ${r.hv.mean} · p10 ${r.hv.p10} · p50 ${r.hv.p50} · p90 ${r.hv.p90}</p></div>`);
      }
      if (state.longRunMCResult) {
        const r = state.longRunMCResult;
        const fmt = (st) => `${st.mean.toFixed(2)} ± ${st.stddev.toFixed(2)} [最小=${st.min}, 最大=${st.max}]`;
        entries.push(`<div class="item good"><strong>长期自播放 · ${r.trials} 次模拟 · ${r.rounds} 回合</strong><p>多步前瞻当玩家,每回合抽手牌 → 找最佳 → 应用 → 塌陷。终态:<br><b>存活高价值</b> ${fmt(r.hv)} · <b>收益倍率</b> ${fmt(r.lootMult)} · <b>规划分</b> ${fmt(r.value)} · <b>可达</b> ${fmt(r.reach)}</p></div>`);
      }
      if (state.goalRecommendation) {
        const r = state.goalRecommendation;
        const tgt = GOAL_TEMPLATES[r.targetId];
        const g = r.gap;
        const milestoneHtml = g.milestones.map(m => `<div class="milestone-row"><span class="${m.done ? 'done' : 'pending'}">${m.done ? '✓' : '◯'} ${m.label}</span></div>`).join("");
        // round s.5: 区分 play action(本轮放卡) 和 meta advice(长期决策)
        const playActions = r.actions.filter(a => a.type !== "architect-kill-meta");
        const actionHtml = playActions.slice(0, 5).map(a => `<li>${a.title}</li>`).join("");
        const metaAdvice = r.metaAdvice || r.actions.filter(a => a.type === "architect-kill-meta");
        const metaHtml = metaAdvice.length > 0
          ? `<p style="margin-top:10px"><b>⚠ 长期决策建议</b></p><ul style="margin:4px 0 0 18px;padding:0;color:#daa520">${metaAdvice.map(a => `<li>${a.title}</li>`).join("")}</ul>`
          : "";
        const exitLabel = EXIT_LABEL[tgt.exitStrategy] ?? tgt.exitStrategy;
        entries.push(`<div class="item good"><strong>本次进神庙建议 · ${tgt.label}</strong><p>距目标进度:<b>${g.progress}%</b> (${g.matchedSpec} / ${g.totalSpec} 格匹配)。出口策略:<b>${exitLabel}</b>。</p>${milestoneHtml}<p style="margin-top:8px"><b>推荐动作(按缺口减少幅度排序)</b></p><ol style="margin:4px 0 0 18px;padding:0">${actionHtml || "<li>当前手牌 / 纹章池暂无可推进动作 — 试关闭神庙重抽</li>"}</ol>${metaHtml}</div>`);
      }
      if (state.goalProjection) {
        const r = state.goalProjection;
        const tgt = GOAL_TEMPLATES[r.targetId];
        const compRate = (r.completionRate * 100).toFixed(0);
        let visitsDist = r.visitsHistogram;
        const fmtP = (st) => st.count > 0 ? `${st.mean.toFixed(1)} ± ${st.stddev.toFixed(1)} [10 分位=${st.p10} · 中位=${st.p50} · 90 分位=${st.p90}]` : "未达成";
        entries.push(`<div class="item warning"><strong>展望 · ${tgt.label} · ${r.trials} 次模拟 × ${r.maxVisits} 次进庙</strong><p>完成率(所有里程碑达成): <b>${compRate}%</b><br>达成所需进庙次数分布: ${fmtP(visitsDist)}<br>终态进度: ${r.finalProgress.mean.toFixed(1)}% ± ${r.finalProgress.stddev.toFixed(1)} [10 分位=${r.finalProgress.p10}% · 90 分位=${r.finalProgress.p90}%]</p><p style="margin-top:6px;font-size:11px;color:var(--muted)">注:展望用随机塌陷 + 密探掉率模拟纹章累积。完成率受锁定纹章 / 升阶纹章掉率拖累,实际进度参考分位数。</p></div>`);
      }
      if (state.templateComparison) {
        const cmp = state.templateComparison;
        // 按"稳态平均规划分"排序找最优
        const sorted = [...cmp.results].sort((a, b) => b.steady.value.mean - a.steady.value.mean);
        const best = sorted[0];
        const rows = sorted.map((r, i) => {
          const isBest = i === 0;
          const star = isBest ? "★ " : "";
          const initial = r.initial;
          const steady = r.steady;
          return `<tr ${isBest ? 'style="background:rgba(120,180,80,0.15);font-weight:bold"' : ''}>
            <td>${star}${r.label}</td>
            <td>${initial.namedRoomCount}</td>
            <td>${initial.lockedCount}</td>
            <td>${initial.lootMult.toFixed(2)}×</td>
            <td>${Math.round(initial.score)}</td>
            <td>${steady.value.mean.toFixed(0)} ± ${steady.value.stddev.toFixed(0)}</td>
            <td>${steady.lootMult.mean.toFixed(2)}×</td>
            <td>${steady.hv.mean.toFixed(1)} / ${initial.namedRoomCount}</td>
          </tr>`;
        }).join("");
        entries.push(`<div class="item good"><strong>模板对比 · ${cmp.trials} 次模拟 × ${cmp.rounds} 回合</strong><p>最优:<b>${best.label}</b>(稳态规划分 ${best.steady.value.mean.toFixed(0)})。</p><table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px"><thead><tr style="border-bottom:1px solid var(--muted)"><th align="left">模板</th><th>名房</th><th>J锁</th><th>初始 lootMult</th><th>初始分</th><th>稳态分</th><th>稳态 lootMult</th><th>HV 存活</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:6px;font-size:11px;color:var(--muted)">★ = 当前最优。初始 = 模板刚加载未塌陷的指标;稳态 = ${cmp.rounds} 回合多步前瞻自播放后的平均指标。HV 存活 = 高价值房在 ${cmp.rounds} 回合后存留数。</p></div>`);
      }
      if (!entries.length) {
        entries.push(`<div class="item"><strong>暂无结果</strong><p>点左侧按钮跑一次实验,或者选目标模板看规划建议。结果会留在这里直到你跑下一个。</p></div>`);
      }
      node.innerHTML = entries.join("");
    }

    function renderControls() {
      const sel = el("roomType");
      if (!sel.dataset.ready) {
        const optionable = TEMPLE_DATA.rooms.filter(r => r.id !== "entrance" && r.id !== "path");
        sel.innerHTML = optionable.map(r => `<option value="${r.id}">${r.name_zh}</option>`).join("");
        sel.dataset.ready = "1";
      }
      let info = "未选中任何格子";
      let tierChainHtml = "";
      const selKey = state.selected;
      if (selKey === "foyer") {
        info = "入口(网格外,固定底部中央)。只读。";
      } else if (selKey === "atziri") {
        info = `阿兹里殿堂(网格外,固定顶部对侧)。${atziriReachable() ? "✓ 当前可达" : "✗ 未连通"}`;
      } else if (typeof selKey === "string") {
        const pos = parseKey(selKey);
          if (pos) {
            const tile = tileAt(pos);
            const meta = ROOM_TYPES[tile.content];
            const medLabel = tile.medallion ? ` · ${MEDALLION_LABEL[tile.medallion] ?? tile.medallion}` : "";
            const modsStr = tile.mods ? ` · 强化+${tile.mods}` : "";
            info = `${pos.row},${pos.col} — ${tile.destroyed ? "已销毁(空格)" : (tile.content === "empty" ? "空格" : `${meta?.label ?? tile.content} T${tile.tier}`)}${medLabel}${modsStr}`;
            if (meta) {
              const cur = totalScore(el("ruleSet").value);
              const bd = scoreBreakdown(pos, cur.reachable, cur.powered, cur.amplified, el("ruleSet").value);
              if (bd) info += ` · 规划分 ${Math.round(bd.score)}${bd.flags.length ? ` · ${bd.flags.join(" · ")}` : ""}`;
              el("roomType").value = tile.content;
            el("roomTier").value = tile.tier;
            el("manualWeight").value = tile.manualWeight;
            if (meta.tierChain && meta.tierChain.length > 1) {
              tierChainHtml = meta.tierChain.map((name, i) => `<span class="tc${i === tile.tier ? ' current' : ''}">T${i} ${name}</span>`).join("");
            }
          }
        }
      }
      el("selectedInfo").textContent = info;
      const tcEl = el("tierChain");
      if (tierChainHtml) {
        tcEl.innerHTML = tierChainHtml;
        tcEl.style.display = "flex";
      } else {
        tcEl.style.display = "none";
      }
    }

    function renderHand() {
      const slots = el("handSlots");
      if (!slots) return;
      const items = (state.hand.length ? state.hand : new Array(HAND_SIZE).fill(null));
      // round s.6: 算每张手牌质量(基于当前 goal 推荐器最佳 action 分数)
      let perCardBestScore = new Array(items.length).fill(null);
      let usableCount = 0;
      if (state.goalRecommendation?.actions) {
        for (const a of state.goalRecommendation.actions) {
          if (a.type !== "play-card" || a.handIdx == null) continue;
          const i = a.handIdx;
          const s = a.gapValue || 0;
          if (perCardBestScore[i] == null || s > perCardBestScore[i]) perCardBestScore[i] = s;
        }
        perCardBestScore.forEach(s => { if (s != null && s >= 60) usableCount++; });
      }
      slots.innerHTML = items.map((cardId, i) => {
        if (!cardId) return `<button class="hand-slot empty" disabled>—</button>`;
        const meta = ROOM_TYPES[cardId];
        const score = perCardBestScore[i];
        let qualityClass = "";
        let qualityMark = "";
        if (state.goalRecommendation?.actions) {
          if (score == null) { qualityClass = "card-poor"; qualityMark = "○"; }
          else if (score >= 200) { qualityClass = "card-good"; qualityMark = "●"; }
          else if (score >= 60) { qualityClass = "card-ok"; qualityMark = "◐"; }
          else { qualityClass = "card-poor"; qualityMark = "○"; }
        }
        return `<button class="hand-slot ${qualityClass}" draggable="true" data-hand-idx="${i}" title="${meta?.label ?? cardId}${score != null ? ' · 最佳放置分: ' + Math.round(score) : ' · 无 goal 推荐'} (拖到格子上 或 点击放到选中格)">${qualityMark} ${meta?.label ?? cardId}</button>`;
      }).join("");
      // 顶部质量摘要(先清后插,避免重复)
      const parent = slots.parentNode;
      if (parent?.querySelectorAll) {
        parent.querySelectorAll("#handQualitySummary").forEach(n => n.remove());
        if (state.goalRecommendation?.actions && typeof document?.createElement === "function") {
          const handCount = items.filter(c => c).length;
          const summary = document.createElement("div");
          summary.id = "handQualitySummary";
          summary.style.cssText = "font-size:11px;color:#daa520;margin-bottom:4px";
          summary.textContent = `手牌质量: ${usableCount}/${handCount} 可用 (● 匹配 spec / ◐ 邻接 reach / ○ 暂无放法)`;
          parent.insertBefore(summary, slots);
        }
      }
      slots.querySelectorAll(".hand-slot[data-hand-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          const pos = selectedPos();
          if (!pos) return;
          playCard(Number(btn.dataset.handIdx), pos);
          analyzeAndRender();
        });
        btn.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/handIdx", btn.dataset.handIdx);
          e.dataTransfer.effectAllowed = "move";
          btn.classList.add("dragging");
        });
        btn.addEventListener("dragend", () => btn.classList.remove("dragging"));
      });
    }

    function renderJson() {
      el("jsonPane").value = JSON.stringify({
        ruleSet: el("ruleSet").value,
        strategy: el("strategy").value,
        tiles: state.tiles,
        architectPos: state.architectPos,
        medallionPool: state.medallionPool,
        chain: state.chain,
        chainStrict: state.chainStrict
      }, null, 2);
    }

    // ---- event handlers ----
    el("ruleSet").addEventListener("change", analyzeAndRender);
    el("strategy").addEventListener("change", analyzeAndRender);
    el("risk").addEventListener("change", analyzeAndRender);
    ["protectPath", "avoidBossCut", "showReference"].forEach(id => el(id).addEventListener("change", analyzeAndRender));
    // T4 Atlas Tree 解锁切换 — 同步到 state,改变 effectiveMaxTier 行为
    el("t4Unlocked").addEventListener("change", () => {
      state.t4Unlocked = el("t4Unlocked").checked;
      analyzeAndRender();
    });

    function selectedPos() {
      if (typeof state.selected !== "string") return null;
      if (state.selected === "foyer" || state.selected === "atziri") return null;
      return parseKey(state.selected);
    }

    el("placeRoom").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      const result = placeRoom(pos, el("roomType").value, Number(el("roomTier").value));
      if (result && !result.ok) el("selectedInfo").textContent = `放置失败:${result.reason}`;
      analyzeAndRender();
    });
    el("placePath").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      placePath(pos);
      analyzeAndRender();
    });
    el("clearTile").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      clearTile(pos);
      analyzeAndRender();
    });
    el("upgradeRoom").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      const verdict = canUpgrade(pos);
      if (!verdict.ok) {
        el("selectedInfo").textContent = `升级失败:${verdict.reason}`;
        return;
      }
      const tile = tileAt(pos);
      tile.tier += 1;
      analyzeAndRender();
    });
    el("downgradeRoom").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      applyDestabilize(pos);
      analyzeAndRender();
    });
    el("toggleMedallion").addEventListener("click", () => {
      const pos = selectedPos(); if (!pos) return;
      stickJuatalotli(pos);
      analyzeAndRender();
    });
    // 0.5 PN (#108):"Room-based Medallions can no longer be used inside of an active Temple"
    // 进庙(pendingExit > 0)期间禁用 Room-based 纹章. juatalotli 锁牌不在此 list(它是"贴"不是"use").
    // azcapa/xopec 是上限纹章不入庙也行,不需要禁用.
    function gateRoomMedallionInTemple(name) {
      if ((state.pendingExitDestabilise ?? 0) > 0
          || state.pendingRoyalAccessDestruction
          || state.pendingArchitectRespawn) {
        el("selectedInfo").textContent =
          `⚠ 0.5 PN: Room-based 纹章(${name})在进庙后不可用. ` +
          `必须先 close 神庙(结算累积塌陷)再用. 改在战前预演 tab 沙盘用,或回合前用.`;
        analyzeAndRender();
        return false;
      }
      return true;
    }

    el("useQuipolatl").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("升阶纹章 Quipolatl")) return;
      const pos = selectedPos(); if (!pos) return;
      const ok = consumeQuipolatl(pos);
      if (!ok) el("selectedInfo").textContent = "升阶纹章失败:库存为 0、目标空格/通路、或已满级";
      analyzeAndRender();
    });
    el("useZantipi").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("词条纹章 Zantipi")) return;
      const ok = consumeZantipi();
      if (!ok) el("selectedInfo").textContent = `强化纹章失败:库存为 0 或已达上限 8(当前 ${state.waystoneModCount ?? 0})`;
      else el("selectedInfo").textContent = `已加 1 条 Waystone 词条(共 ${state.waystoneModCount}/8,每开 10 庙减 1)`;
      analyzeAndRender();
    });
    el("usePuhuarte").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("重抽纹章 Puhuarte")) return;
      const ok = consumePuhuarte();
      if (!ok) el("selectedInfo").textContent = "重抽纹章失败:库存为 0";
      analyzeAndRender();
    });
    el("useEstazunti").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("Reward 插槽 Estazunti")) return;
      const ok = consumeEstazunti();
      if (!ok) el("selectedInfo").textContent = "Reward 插槽失败:库存为 0";
      else el("selectedInfo").textContent = `已加 1 个 Reward 插槽(共 ${state.estazuntiExtraSlots ?? 0});下次击杀建筑师可多放 1 张 Restricted Room`;
      analyzeAndRender();
    });
    el("useHayoxi").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("重抽 Reward Hayoxi")) return;
      const ok = consumeHayoxi();
      if (!ok) el("selectedInfo").textContent = "重抽 Reward 失败:库存为 0";
      else el("selectedInfo").textContent = `已加 1 次 Reward 重抽机会(共 ${state.hayoxiPendingRerolls ?? 0})`;
      analyzeAndRender();
    });
    el("useUromoti").addEventListener("click", () => {
      if (!gateRoomMedallionInTemple("加随机房 Uromoti")) return;
      const ok = consumeUromoti();
      if (!ok) el("selectedInfo").textContent = "加随机房失败:库存为 0";
      else el("selectedInfo").textContent = "已加 1 个随机房到手牌";
      analyzeAndRender();
    });
    el("drawHandBtn").addEventListener("click", () => {
      drawHand();
      analyzeAndRender();
    });
    el("collectMedallionsBtn").addEventListener("click", () => {
      collectMedallions();
      analyzeAndRender();
    });
    el("roomTier").addEventListener("change", () => {
      const pos = selectedPos(); if (!pos) return;
      const tile = tileAt(pos);
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return;
      tile.tier = Math.max(0, Math.min(Number(el("roomTier").value), meta.maxTier));
      analyzeAndRender();
    });
    el("manualWeight").addEventListener("change", () => {
      const pos = selectedPos(); if (!pos) return;
      tileAt(pos).manualWeight = Number(el("manualWeight").value);
      analyzeAndRender();
    });

    // 进神庙 = 真实游戏的 "Run Temple":wiki line 135 - 未放下的 Room Cards **此时被丢弃**。
    //                              wiki line 291 - enter marks 一些房,实际删除发生在 close。
    //                              wiki line 786 - 开门一刻自动暗杀。
    // 所以本按钮:Spymaster 暗杀 + 丢弃未放手牌 + 累积 2 abs 塌陷到 close 一并 resolve。
    el("enterTempleEvent").addEventListener("click", () => {
      applyEnterTempleSpymasterAssassinate();
      // 丢弃手牌(wiki line 135:"any unused Room Cards will be discarded")
      const discarded = state.hand.filter(c => c != null).length;
      state.hand = [];
      // 累积 enter 的塌陷
      state.pendingExitDestabilise = (state.pendingExitDestabilise ?? 0) + eventCount(el("ruleSet").value, "enter");
      el("selectedInfo").textContent = `已进入神庙(Run Temple):丢弃未放 ${discarded} 张手牌${state.pendingAssassinateUpgrade ? " · 已暗杀 1 个 Spymaster 等关庙升级" : ""}。本次访问累积 ${state.pendingExitDestabilise} 格塌陷标记,关庙时一并 resolve。`;
      analyzeAndRender();
    });
    // 建筑师击杀:wiki line 293 - 塌陷 resolve 在关庙时(本次成功击杀,不死)。
    // 累积到 pendingExitDestabilise + 标记 chamber 需要重生(关庙时执行)
    el("architectKillEvent").addEventListener("click", () => {
      const cnt = eventCount(el("ruleSet").value, "architect");
      state.pendingExitDestabilise = (state.pendingExitDestabilise ?? 0) + cnt;
      state.pendingArchitectRespawn = true;
      el("selectedInfo").textContent = `已击杀建筑师:累积 ${cnt} 格塌陷标记到关庙(总累积 ${state.pendingExitDestabilise})。建筑师腔室关庙时随机重生。`;
      analyzeAndRender();
    });
    // 阿兹里击杀:同上 + Royal Access 摧毁也延迟到关庙
    el("atziriKillEvent").addEventListener("click", () => {
      const cnt = eventCount(el("ruleSet").value, "atziri");
      // 危险确认:循环策略下不该主动通 Atziri
      const ok = confirm(
        `⚠ 打 Atziri 会触发约 ${cnt} 格塌陷(~50% reach),等于神庙重置。\n\n` +
        `循环刷神庙策略不建议主动打。仅作为终局 / 实验 用。\n\n` +
        `确认继续吗?`
      );
      if (!ok) return;
      state.pendingExitDestabilise = (state.pendingExitDestabilise ?? 0) + cnt;
      state.pendingRoyalAccessDestruction = true;
      el("selectedInfo").textContent = `已击杀阿兹里:累积 ${cnt} 格塌陷标记到关庙(总累积 ${state.pendingExitDestabilise})。Royal Access Chamber 关庙时摧毁。`;
      analyzeAndRender();
    });
    // 关庙 = resolve 本次访问累积的所有事件:塌陷 + Royal Access 摧毁 + 建筑师重生 + Spymaster 升级
    // 然后给下一次访问抽新手牌
    el("closeTemple").addEventListener("click", () => {
      // 1. 阿兹里击杀过 → 先摧毁 Royal Access(在塌陷之前,Royal Access 不应被塌陷再算一遍)
      let royalDestroyed = 0;
      if (state.pendingRoyalAccessDestruction) {
        royalDestroyed = destroyRoyalAccessChambers().length;
        state.pendingRoyalAccessDestruction = false;
      }
      // 2. Spymaster 暗杀升级 resolve
      applyCloseTempleSpymasterUpgrade();
      // 3. 0.5 PN:可达的 Restricted/Console 房在离开神庙时必定结算
      const restrictedClose = applyAccessibleRestrictedRoomCloseDestabilise(el("ruleSet").value);
      // 4. 塌陷:累积 + close 自身
      const closeCount = eventCount(el("ruleSet").value, "close");
      const pending = state.pendingExitDestabilise ?? 0;
      const total = closeCount + pending;
      applyDestabiliseBatch(total);
      state.pendingExitDestabilise = 0;
      // 5. 建筑师重生(关庙后下次访问看到新位置)
      let architectMoved = false;
      if (state.pendingArchitectRespawn) {
        placeArchitectAtRandomTile();
        state.pendingArchitectRespawn = false;
        architectMoved = true;
      }
      // 6. 抽新手牌
      drawHand();
      const parts = [`塌陷 ${total} 格(close ${closeCount} + 累积 ${pending})`];
      if (restrictedClose.picks.length) parts.push(`可达奖励房结算 ×${restrictedClose.picks.length}`);
      if (royalDestroyed) parts.push(`Royal Access ×${royalDestroyed} 摧毁`);
      if (architectMoved) parts.push("建筑师腔室重生");
      parts.push("已抽 6 张新手牌");
      el("selectedInfo").textContent = `已关闭神庙:${parts.join(" · ")}`;
      analyzeAndRender();
    });
    el("respawnArchitect").addEventListener("click", () => {
      placeArchitectAtRandomTile();
      analyzeAndRender();
    });

    el("snakeCompareSim").addEventListener("click", () => {
      clearAllExperimentResults();
      simulateSnakeComparison({
        medallions: Number(el("simMedallions").value),
        closeReps: Number(el("simCloseReps").value),
        enter: el("simEnter").checked,
        architect: el("simArchitect").checked,
        atziri: el("simAtziri").checked
      });
      analyzeAndRender();
    });

    el("snakeCompareMC").addEventListener("click", () => {
      const btn = el("snakeCompareMC");
      const orig = btn.textContent;
      btn.textContent = "统计模拟跑中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          clearAllExperimentResults();
          state.snakeComparisonMC = simulateSnakeComparisonMC({
            medallions: Number(el("simMedallions").value),
            closeReps: Number(el("simCloseReps").value),
            enter: el("simEnter").checked,
            architect: el("simArchitect").checked,
            atziri: el("simAtziri").checked
          }, 100);
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });

    el("strategyCompareBtn").addEventListener("click", () => {
      const btn = el("strategyCompareBtn");
      const orig = btn.textContent;
      btn.textContent = "对比跑中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          clearAllExperimentResults();
          state.strategyCompareResult = compareSnakeStrategiesMC({
            limbLength: 4,
            closeReps: Number(el("simCloseReps").value)
          }, 100);
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });

    // #105 模拟当前布局 — 跑 simulateLongRunMC 直接对当前 state.tiles,结果独立 state 字段不污染实战
    el("simCurrentLayoutBtn")?.addEventListener("click", () => {
      const btn = el("simCurrentLayoutBtn");
      const orig = btn.textContent;
      btn.textContent = "模拟中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          clearAllExperimentResults();
          const mode = el("simDestabMode")?.value || "chain-end";
          const rounds = Math.max(1, Math.min(50, Number(el("simRounds")?.value) || 5));
          const trials = Math.max(1, Math.min(200, Number(el("simTrials")?.value) || 30));
          const seedSnapshot = snapshot();
          state.currentLayoutSim = {
            mode, rounds, trials,
            timestamp: Date.now(),
            ...simulateLongRunMC({
              rounds,
              beamDepth: 2,
              beamWidth: 3,
              actionCap: 10,
              destabiliseMode: mode,
              eventName: "close",
              seedFn: () => restore(seedSnapshot),
            }, trials),
          };
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });

    el("longRunMCBtn").addEventListener("click", () => {
      const btn = el("longRunMCBtn");
      const orig = btn.textContent;
      btn.textContent = "长期跑中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          clearAllExperimentResults();
          const seedSnapshot = snapshot();
          state.longRunMCResult = simulateLongRunMC({
            rounds: 5,
            beamDepth: 2,
            beamWidth: 3,
            actionCap: 10,
            destabiliseMode: "chain-end",
            eventName: "close",
            seedFn: () => restore(seedSnapshot)
          }, 30);
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });

    el("snakePreset").addEventListener("click", loadSnakePreset);
    el("sacrificeLimbPreset").addEventListener("click", () => {
      loadSacrificeLimbInternal(8);
      analyzeAndRender();
    });
    el("multiChainPreset").addEventListener("click", () => {
      loadMultiChainInternal();
      analyzeAndRender();
    });

    // Python sweep 最优变体 — 先试 fetch(走 http server 时可用)
    // 否则弹文件选择器(file:// 协议需要手动选)
    function applyPythonImport(data) {
      resetTemple();
      if (state.architectPos) clearTile(state.architectPos);
      for (const e of data.layout_spec) {
        const tile = tileAt({ row: e.row, col: e.col });
        if (!tile) continue;
        if (isFoyerTile({ row: e.row, col: e.col })) continue;
        tile.content = e.content;
        tile.tier = e.tier ?? 0;
        tile.destroyed = false;
        tile.medallion = e.medallion ?? null;
        tile.rewardLocked = !!e.rewardLocked;
      }
      autoUpgradeAll();
      state.pythonImportResult = {
        label: data.label,
        params: data.params,
        loot: data.stats.loot,
        hv: data.stats.hv,
        mode: data.mode,
        source: data.meta?.source_sweep
      };
      state.longRunMCResult = null;
      state.snakeComparison = null;
      state.snakeComparisonMC = null;
      state.strategyCompareResult = null;
      analyzeAndRender();
    }

    // 修复 P2:实验/规划按钮间互相清状态 — 否则旧结果会继续渲染让新按钮看着没生效.
    // 任何 result-producing 按钮 SET 自己的字段之前先调这个清掉别人.
    function clearAllExperimentResults() {
      state.snakeComparison = null;
      state.snakeComparisonMC = null;
      state.strategyCompareResult = null;
      state.longRunMCResult = null;
      state.goalRecommendation = null;
      state.goalProjection = null;
      state.templateComparison = null;
      state.currentLayoutSim = null;  // #105
    }

    // 修复 #104:实战 tab 棋盘有真实记录时,载入模板前必须确认.
    // "有内容" = 非空 tile 数 > 1(foyer 是 1)或 destabiliseLog 有记录.
    function templeHasContent() {
      let nonEmpty = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const t = state.tiles[r][c];
        if (!t) continue;
        if (t.content !== "empty" && !t.destroyed) nonEmpty++;
      }
      // foyer 自己也是 path,排除 1.阈值放宽到 > 3,允许玩家随便点几个格不弹.
      if (nonEmpty > 3) return true;
      if ((state.destabiliseLog || []).length > 0) return true;
      return false;
    }

    // 校准卡 — Probe / Plan A / Plan B 三按钮直接载入对应模板
    function loadTemplateById(id) {
      const tmpl = GOAL_TEMPLATES[id];
      if (!tmpl) { console.warn("template not found:", id); return false; }
      // 修复 #104:实战 tab + 棋盘已有真实记录 → 弹 confirm 避免覆盖游戏中的进度.
      const activeView = (typeof document !== "undefined" && document.body)
        ? document.body.getAttribute("data-active-view") || "combat" : "combat";
      const sameTpl = state.lastLoadedTemplate === id;
      if (activeView === "combat" && templeHasContent() && !sameTpl) {
        const ok = confirm(
          `⚠ 实战页:当前棋盘已有记录(房间数 + 塌陷日志)。\n\n` +
          `载入模板 ${tmpl.label || id} 会覆盖现有棋盘 — 真实神庙状态丢失。\n\n` +
          `推荐流程:在【战前预演】或【开服校准】tab 沙盘对比;实战 tab 用【重置】+ 手动建。\n\n` +
          `确认覆盖?`
        );
        if (!ok) return false;
      }
      resetTemple();
      loadGoalTemplateToTiles(tmpl);
      const sel = el("goalTemplateSelect");
      if (sel) sel.value = id;
      // 触发 description 更新
      const ev = new Event("change");
      sel?.dispatchEvent(ev);
      state.selected = tileKey(FOYER_TILE);
      state.lastLoadedTemplate = id;
      analyzeAndRender();
      return true;
    }
    el("loadProbe")?.addEventListener("click", () => loadTemplateById("probe-calibration"));
    el("loadPlanA")?.addEventListener("click", () => loadTemplateById("core-shell-cycle"));
    el("loadPlanB")?.addEventListener("click", () => loadTemplateById("plan-a-b2-hybrid"));

    el("loadCalibrationSummary")?.addEventListener("click", async () => {
      const btn = el("loadCalibrationSummary");
      const orig = btn.textContent;
      btn.textContent = "读取中...";
      btn.disabled = true;
      try {
        const resp = await fetch("results/calibration-summary.json", { cache: "no-store" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        state.calibrationSummary = await resp.json();
        analyzeAndRender();
      } catch (err) {
        alert("读取失败: 请先运行 python sim/analyze_observations.py,并用 start.bat/http server 打开页面。错误: " + err.message);
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    });

    el("addCalibrationRow")?.addEventListener("click", () => {
      const row = calibrationObservationFromSelected();
      if (!row) {
        alert("先在中间棋盘点一个塌陷格。");
        return;
      }
      state.calibrationRows = [...(state.calibrationRows || []), row];
      const visitInput = el("calibrationVisit");
      if (visitInput) visitInput.value = String(row.visit);
      analyzeAndRender();
    });

    el("copyCalibrationCsv")?.addEventListener("click", async () => {
      const text = calibrationCsvText(true);
      try {
        await navigator.clipboard.writeText(text);
        el("selectedInfo").textContent = `已复制 ${state.calibrationRows.length} 行校准 CSV`;
      } catch (err) {
        const preview = el("calibrationCsvPreview");
        if (preview) preview.select?.();
        alert("复制失败:请手动复制下方文本。错误:" + err.message);
      }
    });

    el("downloadCalibrationCsv")?.addEventListener("click", () => {
      const blob = new Blob([calibrationCsvText(true)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "field-observation.csv";
      a.click();
      URL.revokeObjectURL(url);
    });

    el("clearCalibrationRows")?.addEventListener("click", () => {
      state.calibrationRows = [];
      analyzeAndRender();
    });

    el("loadPythonBest").addEventListener("click", async () => {
      const btn = el("loadPythonBest");
      const orig = btn.textContent;
      btn.textContent = "加载中...";
      btn.disabled = true;
      try {
        // 先 fetch(http server)
        let data = null;
        try {
          const resp = await fetch("results/core-shell-best.json");
          if (resp.ok) data = await resp.json();
        } catch (e) {
          // fetch 失败(file:// 或 CORS),走 file picker
        }
        if (!data) {
          // 弹文件选择器让用户手动选
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.addEventListener("change", async () => {
            const f = input.files?.[0];
            if (!f) return;
            const text = await f.text();
            try {
              const parsed = JSON.parse(text);
              applyPythonImport(parsed);
            } catch (err) {
              alert("JSON 解析失败: " + err.message);
            }
          });
          input.click();
          return;
        }
        applyPythonImport(data);
      } catch (err) {
        alert("加载失败: " + err.message);
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    });

    // ===== Campaign Console — 目标模板 dropdown(分主推 / 历史 2 组) + 建议 + 展望 =====
    (() => {
      const sel = el("goalTemplateSelect");
      if (sel) {
        const primaryIds = ["probe-calibration", "core-shell-cycle", "plan-a-b2-hybrid", "pn05-chain-safe", "core-shell-plan-b", "snake-v3", "ring-v3", "ring-v3-dense", "sidechain-v3", "snake-v3-no-lock"];
        const primary = primaryIds.filter(id => GOAL_TEMPLATES[id]);
        const legacy = Object.keys(GOAL_TEMPLATES).filter(id => !primaryIds.includes(id));
        const mkOpt = (id) => `<option value="${id}">${GOAL_TEMPLATES[id].label}</option>`;
        sel.innerHTML = (
          `<optgroup label="主推(✦/★ · 50+ 房 · 直链补偿)">${primary.map(mkOpt).join("")}</optgroup>` +
          `<optgroup label="历史 / 参考(早期迭代)">${legacy.map(mkOpt).join("")}</optgroup>`
        );
        const updateDesc = () => {
          const t = GOAL_TEMPLATES[sel.value];
          el("goalDescription").textContent = t ? t.description : "";
        };
        sel.addEventListener("change", updateDesc);
        updateDesc();
      }
    })();

    el("recommendGoalBtn").addEventListener("click", () => {
      const id = el("goalTemplateSelect").value;
      const target = GOAL_TEMPLATES[id];
      if (!target) return;
      const result = recommendForGoal(target, el("ruleSet").value);
      clearAllExperimentResults();
      state.goalRecommendation = { targetId: id, ...result };
      analyzeAndRender();
    });

    el("projectVisitsBtn").addEventListener("click", () => {
      const btn = el("projectVisitsBtn");
      const orig = btn.textContent;
      btn.textContent = "展望跑中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          const id = el("goalTemplateSelect").value;
          const target = GOAL_TEMPLATES[id];
          if (!target) return;
          clearAllExperimentResults();
          state.goalProjection = { targetId: id, ...projectVisitsToGoal(target, 25, 30, el("ruleSet").value) };
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });
    el("compareAllTemplatesBtn").addEventListener("click", () => {
      const btn = el("compareAllTemplatesBtn");
      const orig = btn.textContent;
      btn.textContent = "对比跑中…";
      btn.disabled = true;
      setTimeout(() => {
        try {
          clearAllExperimentResults();
          state.templateComparison = analyzeAllGoalTemplates({ trials: 10, rounds: 5 });
          analyzeAndRender();
        } finally {
          btn.textContent = orig;
          btn.disabled = false;
        }
      }, 10);
    });
    el("reset").addEventListener("click", resetTemple);
    // combat 中列「重置神庙」:复用 reset 逻辑(resetTemple 内已 analyzeAndRender),
    // 再覆盖循环助手持久化快照,避免下次 init 又恢复旧神庙。
    el("loopResetBtn") && el("loopResetBtn").addEventListener("click", () => {
      resetTemple();
      try {
        if (window.__loopUI && window.__loopUI.saveLoopState && window.localStorage) {
          window.__loopUI.saveLoopState(window.localStorage);
        }
      } catch (e) { /* 无 localStorage:忽略 */ }
    });
    el("exportJson").addEventListener("click", async () => {
      await navigator.clipboard.writeText(el("jsonPane").value);
      el("exportJson").textContent = "已复制";
      setTimeout(() => el("exportJson").textContent = "导出 JSON", 900);
    });

    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const json = tab.dataset.tab === "json";
        el("jsonPane").style.display = json ? "block" : "none";
        el("notesPane").style.display = json ? "none" : "block";
      });
    });

    // 顶级视图切换(实战 / 战前预演 / 校准)— 通过 body[data-active-view] 控制左右侧栏可见性
    // 中央神庙网格 + 指标卡三个 tab 都显示(玩家始终看得到神庙)
    if (document.body) document.body.dataset.activeView = "combat";
    document.querySelectorAll(".view-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".view-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        if (document.body) document.body.dataset.activeView = tab.dataset.view;
        // 切 tab 后立刻重渲染 metrics(主/研究指标列表不同)
        try { renderMetrics(); } catch (e) {}
        // 任务 8a:切到 combat 时整体重渲染一次,让循环助手三列(道具/格子/清单)填充。
        // analyzeAndRender 内部对非 combat 视图会跳过循环助手渲染,故只在 combat 触发。
        if (tab.dataset.view === "combat") { try { analyzeAndRender(); } catch (e) {} }
      });
    });

    window.templeSim = {
      state, resetTemple, loadSnakePreset, tileAt, tileKey, parseKey,
      FOYER_TILE, ATZIRI_TILE, GRID_SIZE,
      setRng, getRng, makeSeededRng, rnd,
      placeRoom, placePath, clearTile, canUpgrade, canPlaceRoom, bfsConnectedFrom,
      reachableFromFoyer, atziriReachable, buildChain, wouldDisconnect,
      canConnect, poweredTiles, amplifiedTiles, generatorRange, hasRequiredPower,
      isDestabiliseEligible, selectDestabiliseTargets, applyDestabiliseBatch, applyDestabilize,
      applyAccessibleRestrictedRoomCloseDestabilise,
      applyEnterTempleSpymasterAssassinate, applyCloseTempleSpymasterUpgrade,
      destroyRoyalAccessChambers, applyGarrisonConversions, autoUpgradeAll,
      stickJuatalotli, consumeQuipolatl, consumeZantipi, consumePuhuarte,
      consumeEstazunti, consumeHayoxi, consumeUromoti,
      collectMedallions, placeArchitectAtRandomTile,
      placeRewardRoomFromConsole, countRewardLocked,
      applyPlanningAction, playCard,
      drawHand, playCard,
      simulateSnakeComparison, simulateSnakeComparisonMC, distStat, snapshot, restore,
      loadSnakePresetInternal, loadSacrificeLimbInternal, loadMultiChainInternal, loadMultiChainPreset,
      applyEventCycleWithRepair, compareSnakeStrategiesMC,
      simulateLongRun, simulateLongRunMC, analyzeAllGoalTemplates, loadGoalTemplateToTiles,
      GOAL_TEMPLATES, stateGapToTarget, recommendForGoal, projectVisitsToGoal,
      computeBlueprintDiff: (bp) => window.__strategyLayer.computeBlueprintDiff(bp),
      makeBlueprintStrategy: (cfg) => window.__strategyLayer.makeBlueprintStrategy(cfg),
      get STRATEGIES() { return window.__strategyLayer.STRATEGIES; },
      loadStrategyParams: (c) => window.__strategyLayer.loadStrategyParams(c),
      saveLoopState: (s) => window.__loopUI.saveLoopState(s),
      loadLoopState: (s) => window.__loopUI.loadLoopState(s),
      applyCollapseMarks: (m) => window.__loopUI.applyCollapseMarks(m),
      // 傻瓜塌陷实测器:采集 + 浏览器端口分析(faithful port of analyze_observations.py)
      captureProbeBatch: (m) => window.__loopUI.captureProbeBatch(m),
      analyzeProbe: (log) => window.__loopUI.analyzeProbe(log),
      resetProbeLog: () => window.__loopUI.resetProbeLog(),
      probeModePdf: (mode, d, dmax) => window.__loopUI.modePdf(mode, d, dmax),
      probeComputeModeLikelihoods: (obs) => window.__loopUI.computeModeLikelihoods(obs),
      probeLikelihoodsToPosterior: (ll, pr) => window.__loopUI.likelihoodsToPosterior(ll, pr),
      probeRecommend: (post, n) => window.__loopUI.recommendProbe(post, n),
      toggleMarkMode: () => window.__loopUI.toggleMarkMode(),
      buildActionChecklist: (s,b) => window.__loopUI.buildActionChecklist(s,b),
      renderInventory: () => window.__loopUI.renderInventory(),
      renderChecklist: () => window.__loopUI.renderChecklist(),
      renderStrategyOptions: () => window.__loopUI.renderStrategyOptions(),
      renderConnectionOverlay: () => window.__loopUI.renderConnectionOverlay(),
      templeHasContent, computeCombatAdvice, loadTemplateById,  // #104 暴露给测试 + 编程接入
      totalScore, roomValue, scoreTile,
      scoreBreakdown, recommendActions,
      occupiedSlots, emptySlots, reachableEmptyNeighbors, chainEndpoints, degreeMap,
      minDistanceToAtziri, evaluateSnakePotential, detectBuildPhase, phaseDetector,
      reachableSpymasterTiles, computeLimbBuffer, computeRingHealth,
      renderCalibrationSummary, calibrationTemplateForStatus, topModeFromPosterior,
      renderCutVertexCard, renderLockCard,
      calibrationObservationFromSelected, calibrationRowToCsv, calibrationCsvText, renderCalibrationRecorder,
      computeRepairState,
      generateActions, simulateActionSequence, rankPlans,
      stateValue, quickActionScore, beamSearchPlans, actionUniqueKey,
      EVENT_PERCENT, eventCount, MEDALLION_TYPES, MEDALLION_DROP_WEIGHTS, HAND_SIZE,
      ROOM_TYPES,
      // Atlas 全点(atlasFullClear):暴露给测试 / 编程接入
      atlasModMult, adjacentRoomCount, rollRewardPrerogativeImmune,
      ATLAS_POWER_RELAYS_MULT, ATLAS_EFFICIENT_ARTERIES_MULT, ATLAS_EFFICIENT_ARTERIES_THRESHOLD,
      ATLAS_XIPOCADO_MULT, ATLAS_ROYAL_PREROGATIVE_CHANCE
    };

    resetTemple();

    // 任务 8a + 首屏修复:08-ui 早于 09/10 加载 → 此处若直接 loadLoopState / analyzeAndRender,
    // window.__loopUI(策略层/循环 UI 在 09/10 里)尚未挂全,combat 循环助手渲染(策略下拉/库存/
    // 清单/实测器面板,见 analyzeAndRender 内 __loopUI 守卫)会被静默跳过、loadLoopState 也漏跑,
    // 导致循环助手三列首屏空白。改在 DOMContentLoaded(全部 body 脚本执行完、__loopUI 就绪后)
    // 再恢复持久化 + 整页渲染。Node 测试环境无真实 DOMContentLoaded 事件 → 此回调不触发,零影响。
    function __initLoopAssistant() {
      try {
        if (window.__loopUI && window.__loopUI.loadLoopState && window.localStorage) {
          window.__loopUI.loadLoopState(window.localStorage);
        }
      } catch (e) { /* 无 localStorage 或快照损坏:忽略,保持空神庙 */ }
      analyzeAndRender();   // __loopUI 已就绪 → 循环助手三列 + 策略下拉正常填充
    }
    if (typeof document !== "undefined" && document.addEventListener) {
      document.addEventListener("DOMContentLoaded", __initLoopAssistant);
    }
