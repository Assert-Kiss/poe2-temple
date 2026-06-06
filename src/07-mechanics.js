    function placeArchitectAtRandomTile() {
      // wiki L211 修正:建筑师占 1 个 grid tile,typically far half (rows 0-3)。
      // 候选:empty / path / 低价值"轮换槽"(garrison/armoury T1)— 跳过 foyer + atziri 锚点对应格 (0,4) + 高 tier 房。
      const candidates = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        if (isFoyerTile(pos)) continue;
        // 修复 P2:(0,4) 是 Atziri 连接格,建筑师不可占,否则上方连接语义错乱
        if (pos.row === ATZIRI_TILE.row && pos.col === ATZIRI_TILE.col) continue;
        const tile = tileAt(pos);
        if (tile.content === "empty" || tile.content === "path") candidates.push(pos);
      }
      if (!candidates.length) return null;
      const pick = candidates[Math.floor(rnd() * candidates.length)];
      if (state.architectPos) {
        const oldTile = tileAt(state.architectPos);
        if (oldTile && oldTile.content === "architect_chamber") { oldTile.content = "empty"; oldTile.tier = 0; }
      }
      const tile = tileAt(pick);
      tile.content = "architect_chamber"; tile.tier = 0;
      state.architectPos = pick;
      return pick;
    }

    // 模拟 Architect 击杀后从 Xipocado's Console 放置 Reward Room。
    // 0.5 PN:不进普通随机池;若关庙时可达,会单独结算 destabilise。
    // rewardType:reward room 的 id(如 "kishara_vault"、"sealed_vault" 等),pos:目标格子。
    // 返回 { ok, reason } — ok=true 表示放置成功。
    function placeRewardRoomFromConsole(pos, rewardType) {
      const tile = tileAt(pos);
      if (!tile) return { ok: false, reason: "无效位置" };
      if (isFoyerTile(pos)) return { ok: false, reason: "入口不可放" };
      const meta = ROOM_TYPES[rewardType];
      if (!meta) return { ok: false, reason: "未知奖励房类型" };
      if (meta.category !== "reward") return { ok: false, reason: `${meta.label} 不是奖励房类型` };
      // 必须放在空格或被销毁格子(不能覆盖已存在房间)
      if (!tile.destroyed && tile.content !== "empty" && tile.content !== "path") {
        return { ok: false, reason: "目标格已被占用,需要空格/通路/销毁格" };
      }
      tile.content = rewardType;
      tile.tier = Math.min(1, meta.maxTier ?? 1);  // reward room 默认 tier 1
      tile.destroyed = false;
      tile.rewardLocked = true;  // Xipocado's Console 放置标志:普通随机池免疫,close 另算
      return { ok: true };
    }

    // 统计当前 reward-locked 房间数(用于 UI / 规划)
    function countRewardLocked() {
      let n = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        if (state.tiles[r][c].rewardLocked) n++;
      }
      return n;
    }

    function resetTemple() {
      tilesInit();
      state.architectPos = null;
      state.royalAccessPos = null;
      state.selected = tileKey(FOYER_TILE);
      // 修复 P1 + P3:medallionPool 用全 9 种纹章,跟 MEDALLION_TYPES + 01-core 初始一致
      state.medallionPool = {
        juatalotli: 0, quipolatl: 0, zantipi: 0, puhuarte: 0,
        estazunti: 0, hayoxi: 0, uromoti: 0, azcapa: 0, xopec: 0
      };
      state.hand = [];
      state.handInventory = {};
      state.destabiliseLog = [];
      state.chain = [];
      state.chainStrict = false;
      // 修复 P1:清掉所有累积的 pending 状态(close 前残留的塌陷标记 / 待重生 / 待摧毁等)
      state.pendingAssassinateUpgrade = null;
      state.pendingExitDestabilise = 0;
      state.pendingRoyalAccessDestruction = false;
      state.pendingArchitectRespawn = false;
      state.waystoneModCount = 0;
      // Atlas 全点假设:Transcendent Progress 已点 → T4 默认解锁(见 atlasFullClear)。
      state.t4Unlocked = true;
      state.estazuntiExtraSlots = 0;
      state.hayoxiPendingRerolls = 0;
      // 修复 P1:清掉所有实验/规划/方案的旧结果,避免重置后 lab 面板继续渲染上一轮
      state.snakeComparison = null;
      state.snakeComparisonMC = null;
      state.strategyCompareResult = null;
      state.longRunMCResult = null;
      state.goalRecommendation = null;
      state.goalProjection = null;
      state.templateComparison = null;
      state.pythonImportResult = null;
      state.lastLoadedTemplate = null;
      state.currentLayoutSim = null;  // #105 模拟当前布局结果
      // 校准证据由 UI 的专用按钮管理,避免加载模板/重置棋盘误清现场观测行。
      // 入口 cell 永远是 locked path(本地坐标模型约定,需由实服 UI 复核)
      const foyerTile = tileAt(FOYER_TILE);
      if (foyerTile) { foyerTile.content = "path"; foyerTile.tier = 0; foyerTile.destroyed = false; }
      placeArchitectAtRandomTile();
      analyzeAndRender();
    }

    function isFoyerTile(pos) {
      return pos && pos.row === FOYER_TILE.row && pos.col === FOYER_TILE.col;
    }

    function placeRoom(pos, content, tier) {
      if (isFoyerTile(pos)) return { ok: false, reason: "入口不可放" };
      const tile = tileAt(pos);
      if (!tile) return { ok: false, reason: "无效位置" };
      const meta = ROOM_TYPES[content];
      if (!meta) return { ok: false, reason: "未知房型" };
      // 注:placeRoom 是【设计态原语】—— 允许覆盖 path/room(布局编辑:先 placePath 连通、再 placeRoom 改成房)。
      // 「游戏里通路上不能放房」是【对战态规则】,由 playCard(01-core)+ 策略 isLandingCell(09)把关,不在此原语层。
      const verdict = canPlaceRoom(pos, content);
      if (!verdict.ok) return verdict;
      tile.content = content;
      tile.tier = Math.max(0, Math.min(tier ?? 0, meta.maxTier));
      tile.destroyed = false;
      if (content === "architect_chamber") {
        if (state.architectPos && tileKey(state.architectPos) !== tileKey(pos)) {
          const oldTile = tileAt(state.architectPos);
          if (oldTile && oldTile.content === "architect_chamber") { oldTile.content = "empty"; oldTile.tier = 0; }
        }
        state.architectPos = pos;
      }
      return { ok: true };
    }

    function roomLabel(id) { return ROOM_TYPES[id]?.label ?? id; }

    function checkUpgradeRule(rule, pos, ctx = {}) {
      // Legacy array form ["r1", "r2"] = require ALL listed adjacent (equivalent to {rooms, requireAll:true}).
      if (Array.isArray(rule)) {
        if (!rule.length) return { ok: true };
        const adjContents = new Set(adjacentInBounds(pos).map(p => {
          const t = tileAt(p);
          return t.destroyed ? "empty" : t.content;
        }));
        const missing = rule.filter(r => !adjContents.has(r));
        return missing.length
          ? { ok: false, reason: `邻接需要:${missing.map(roomLabel).join("、")}` }
          : { ok: true };
      }
      if (!rule || !rule.rooms || !rule.rooms.length) {
        // 仅供能要求(无邻接)
        if (rule && rule.requiresPower) {
          return checkPowerRequirement(pos, ctx);
        }
        return { ok: true };
      }
      const adjPositions = adjacentInBounds(pos);
      let adjOk = false;
      let adjFail = null;
      if (rule.requireAll) {
        const adjContents = new Set(adjPositions.map(p => {
          const t = tileAt(p);
          return t.destroyed ? "empty" : t.content;
        }));
        const missing = rule.rooms.filter(r => !adjContents.has(r));
        if (missing.length) {
          adjFail = { ok: false, reason: `邻接需要(全部):${missing.map(roomLabel).join("、")}` };
        } else {
          adjOk = true;
        }
      } else {
        const need = rule.count ?? 1;
        let matched = 0;
        for (const p of adjPositions) {
          const t = tileAt(p);
          if (!t || t.destroyed) continue;
          if (!rule.rooms.includes(t.content)) continue;
          if (rule.minTier != null && (t.tier ?? 0) < rule.minTier) continue;
          matched++;
        }
        if (matched >= need) {
          adjOk = true;
        } else {
          const tierStr = rule.minTier != null ? `T${rule.minTier}+ ` : "";
          const orList = rule.rooms.map(roomLabel).join(" 或 ");
          adjFail = { ok: false, reason: `邻接需要 ${need} 个 ${tierStr}${orList}(当前 ${matched})` };
        }
      }
      if (!adjOk) return adjFail;
      if (rule.requiresPower) return checkPowerRequirement(pos, ctx);
      return { ok: true };
    }

    // 检查 pos 是否被任意可达 Generator 供能(Manhattan ≤ 该 Generator 当前 tier 的 range)
    function checkPowerRequirement(pos, ctx = {}) {
      const reachable = ctx.reachable ?? reachableFromFoyer();
      const powered = ctx.powered ?? poweredTiles(reachable);
      if (!powered.has(tileKey(pos))) {
        return { ok: false, reason: "需要 Generator 供能" };
      }
      return { ok: true };
    }

    function canUpgrade(pos, ctx = {}) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty" || tile.content === "path") return { ok: false, reason: "空格/通路不可升级" };
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return { ok: false, reason: "未知房型" };
      const nextTier = tile.tier + 1;
      const maxCap = effectiveMaxTier(meta);
      if (nextTier > maxCap) return { ok: false, reason: `已达最高等级 T${maxCap}${state.t4Unlocked || (meta.maxTier ?? 0) <= 3 ? "" : "(T4 需 Atlas Tree 解锁)"}` };
      const adjReq = meta.upgradeAdjacency && meta.upgradeAdjacency[String(nextTier)];
      if (adjReq) {
        const result = checkUpgradeRule(adjReq, pos, ctx);
        if (!result.ok) return { ok: false, reason: `T${nextTier} 升级:${result.reason}` };
      }
      return { ok: true };
    }

    // Golem Works 特化:返回该位置可达 Generator 的供能数(每个 Generator 算一次,叠加)
    // 用于 powerTier 机制:tier = 1 + min(count, maxStack)
    function countGeneratorsPoweringTile(pos, reachableSet) {
      let count = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const gpos = { row: r, col: c };
        const tile = tileAt(gpos);
        if (!tile || tile.destroyed) continue;
        if (tile.content !== "generator") continue;
        if (reachableSet && !reachableSet.has(tileKey(gpos))) continue;
        const range = generatorRange(tile);
        if (range <= 0) continue;
        const md = Math.abs(r - pos.row) + Math.abs(c - pos.col);
        if (md <= range) count++;
      }
      return count;
    }

    // 被动升级:扫描所有命名房间,若下一级有显式邻接规则且条件满足,则自动升一档。
    // 迭代到稳态(单次升级可能触发链式升级,例如 Smithy 升 T3 后 Armoury 也可能解锁)。
    // 触发时机(per user 2026-05-18): 进神庙放卡后立刻升,本次访问吃到 buff。
    // 调用点:playCard 后、consumeQuipolatl 后(可能引发级联)、预设加载完成后、长期模拟里的 applyPlanningAction 后。
    // 保守策略:缺显式 T2/T3 规则且无 powerTier 字段的房间(Spymaster、Sacrificial Chamber、所有金库)不自动升,只由手动按钮 / 升阶纹章 / 后续游戏内验证的其他机制触发。
    // GGPK / 官方文本映射到本地模型的特殊机制:
    //   - Golem Works 用 powerTier 字段:tier = 1 + min(generator-count, maxStack)
    //   - Transcendent Barracks T3 用 requiresPower:邻接 Synthflesh + Generator 供能
    // Garrison 自动转换(poe2wiki line 426-427):
    //   Garrison 邻接 Synthflesh Lab → 转换为 T2 Transcendent Barracks
    //   Garrison 邻接 Spymaster      → 转换为 T2 Legion Barracks(并切断 Commander 连接,由 notConnectableTo 自动处理)
    // Garrison 同时邻接两者时:Synthflesh 优先(数据顺序)。
    // 调用时机:placeRoom 后(等同 autoUpgradeAll 路径)。
    function applyGarrisonConversions() {
      let changed = false;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (!tile || tile.destroyed || tile.content !== "garrison") continue;
        let synthAdj = false, spyAdj = false;
        for (const nb of adjacentInBounds(pos)) {
          const t = tileAt(nb);
          if (!t || t.destroyed) continue;
          if (t.content === "synthflesh_lab") synthAdj = true;
          if (t.content === "spymaster") spyAdj = true;
        }
        if (synthAdj) {
          tile.content = "transcendent_barracks";
          tile.tier = 2;
          changed = true;
        } else if (spyAdj) {
          tile.content = "legion_barrack";
          tile.tier = 2;
          changed = true;
        }
      }
      return changed;
    }

    function autoUpgradeAll() {
      let changed = true, iter = 0;
      while (changed && iter < 20) {
        changed = false;
        // 每轮先扫 Garrison 转换 — 新转出的 Legion/Transcendent 邻接条件可能再触发后续升级
        if (applyGarrisonConversions()) changed = true;
        const reachable = reachableFromFoyer();
        const powered = poweredTiles(reachable);
        const ctx = { reachable, powered };
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const pos = { row: r, col: c };
          const tile = tileAt(pos);
          if (!tile || tile.destroyed) continue;
          if (tile.content === "empty" || tile.content === "path") continue;
          const meta = ROOM_TYPES[tile.content];
          if (!meta) continue;
          // 1. powerTier 房:tier = 1 + min(generator-count, maxStack) — 优先于邻接规则
          if (meta.powerTier && meta.powerTier.source === "generator") {
            const cnt = countGeneratorsPoweringTile(pos, reachable);
            const target = Math.min(effectiveMaxTier(meta), 1 + Math.min(cnt, meta.powerTier.maxStack ?? 2));
            if (target > tile.tier) {
              tile.tier = target;
              changed = true;
            }
            continue;
          }
          // 2. 邻接规则升级,循环升到底
          while (tile.tier < effectiveMaxTier(meta)) {
            const nextTier = tile.tier + 1;
            const adjReq = meta.upgradeAdjacency && meta.upgradeAdjacency[String(nextTier)];
            if (!adjReq) break;
            const result = checkUpgradeRule(adjReq, pos, ctx);
            if (!result.ok) break;
            tile.tier += 1;
            changed = true;
          }
        }
        iter++;
      }
    }

    function placePath(pos) {
      if (isFoyerTile(pos)) return;
      const tile = tileAt(pos);
      if (!tile) return;
      if (tile.rewardLocked) return;  // console 房不可手动覆盖
      tile.content = "path";
      tile.tier = 0;
      tile.destroyed = false;
      tile.medallion = null;
    }

    function clearTile(pos) {
      if (isFoyerTile(pos)) return;
      const tile = tileAt(pos);
      if (!tile) return;
      if (tile.rewardLocked) return;  // console 房不可手动清空
      if (tile.medallion) {
        // refund the specific medallion type
        if (state.medallionPool[tile.medallion] != null) state.medallionPool[tile.medallion] += 1;
        tile.medallion = null;
      }
      tile.mods = 0;
      if (tile.content === "architect_chamber") state.architectPos = null;
      tile.content = "empty";
      tile.tier = 0;
      tile.destroyed = false;
    }
