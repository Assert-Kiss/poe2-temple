    function totalScore(ruleSet) {
      if (!ruleSet) ruleSet = el("ruleSet").value;
      const reachable = reachableFromFoyer();
      const powered = poweredTiles(reachable);
      const amplified = amplifiedTiles(reachable, powered);
      const strategy = el("strategy").value;
      const stack = computeModStack(reachable, powered, amplified, strategy);
      const lootMult = expectedLootMultiplier(stack);
      const vaults = vaultValueSum(reachable);
      const manualSum = (() => {
        let s = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const t = state.tiles[r][c];
          if (t && !t.destroyed && t.manualWeight) s += t.manualWeight;
        }
        return s;
      })();
      // 空神庙 lootMult = 1 → 贡献 0 分;mod 加满到 ×3 给 +200 分;reward vault 直接相加
      let score = BASE_LOOT * (lootMult - 1) + vaults + manualSum;
      const atzReach = atziriReachable();
      // 修复 #98 P2:去掉旧的 "atziri 可达 +30 / 不可达 -16" 评分倾向。
      // 当前循环策略明确不主动通 Atziri,这两个奖惩污染 stateValue/beam search/recommendForGoal 排序。
      // atziri 可达本身既不是好也不是坏,看玩家是否真要终局打。保留 atziriReachable 让 UI 显示 ⚠.
      return { score, reachable, powered, amplified, atziriReachable: atzReach, stack, lootMult, vaults };
    }

    // round v.2 (2026-05-19): snapshot/restore 改用 JSON 全量深拷贝。
    // 之前手写字段列表只覆盖 9 个,漏了 12 个 (pendingExitDestabilise / waystoneModCount /
    // t4Unlocked / pendingArchitectRespawn / pendingRoyalAccessDestruction /
    // pendingAssassinateUpgrade / snakeComparisonMC / strategyCompareResult /
    // longRunMCResult / goalRecommendation / goalProjection / templateComparison),
    // MC 模拟会泄漏前轮状态。新字段自动覆盖。
    function snapshot() {
      return JSON.parse(JSON.stringify(state));
    }
    function restore(s) {
      const cloned = JSON.parse(JSON.stringify(s));
      // state 是 var 外部引用,不能直接重赋值,逐字段替换
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, cloned);
    }

    function eventCount(rs, k) {
      const ec = EVENT_PERCENT[rs][k];
      if (ec.abs != null) return ec.abs;
      const size = reachableFromFoyer().size;
      return Math.max(1, Math.floor(size * (ec.pct ?? 0)));
    }

    function simulateSnakeComparison(opts) {
      if (!opts) opts = {};
      const medTarget = Math.max(0, Math.min(10, opts.medallions ?? 3));
      const closeReps = Math.max(0, Math.min(10, opts.closeReps ?? 3));
      const enterEvt = opts.enter !== false;
      const archEvt = opts.architect !== false;
      const atziriEvt = opts.atziri !== false;
      const destabiliseMode = opts.destabiliseMode ?? "chain-end";
      const dOpts = { mode: destabiliseMode };
      const original = snapshot();
      const results = { opts: { medallions: medTarget, closeReps, enter: enterEvt, architect: archEvt, atziri: atziriEvt, destabiliseMode } };
      for (const rs of ["0.4", "0.5"]) {
        restore(original);
        loadSnakePresetInternal();
        const chain = buildChain();
        let medCount = 0;
        for (let i = chain.length - 1; i >= 0 && medCount < medTarget; i--) {
          const pos = parseKey(chain[i]);
          const tile = tileAt(pos);
          if (tile && !tile.destroyed && tile.content !== "empty" && tile.content !== "path" && !tile.medallion) {
            tile.medallion = "juatalotli";
            medCount++;
          }
        }
        const initialReachable = reachableFromFoyer().size;
        let initialHighValue = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          if (roomValue({ row: r, col: c }) >= 12) initialHighValue++;
        }
        if (enterEvt) applyDestabiliseBatch(eventCount(rs, "enter"), rs, dOpts);
        if (archEvt) applyDestabiliseBatch(eventCount(rs, "architect"), rs, dOpts);
        if (atziriEvt) applyDestabiliseBatch(eventCount(rs, "atziri"), rs, dOpts);
        for (let i = 0; i < closeReps; i++) applyDestabiliseBatch(eventCount(rs, "close"), rs, dOpts);
        let removed = 0, downgraded = 0;
        for (const log of state.destabiliseLog) {
          for (const p of log.picks) {
            if (p.mode === "downgrade") downgraded++;
            else removed++;
          }
        }
        const reachable = reachableFromFoyer();
        let highValueAlive = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const tile = tileAt({ row: r, col: c });
          if (!tile.destroyed && reachable.has(tileKey({ row: r, col: c })) && roomValue({ row: r, col: c }) >= 12) highValueAlive++;
        }
        results[rs] = {
          initialReachable, initialHighValue,
          finalReachable: reachable.size,
          removed, downgraded, highValueAlive,
          medallionsUsed: medCount
        };
      }
      restore(original);
      state.snakeComparison = results;
      return results;
    }

    // 一组数字 → 分布统计
    function distStat(arr) {
      if (!arr.length) return { count: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = sum / arr.length;
      const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
      const pct = q => sorted[Math.min(sorted.length - 1, Math.floor(arr.length * q))];
      const stddev = Math.sqrt(variance);
      return {
        count: arr.length,
        mean: +mean.toFixed(2),
        stddev: +stddev.toFixed(2),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p10: pct(0.10),
        p50: pct(0.50),
        p90: pct(0.90),
        // round v.10 (任务 #55):风险调整分 = mean - 0.5 * stddev
        // 让"低均值低方差"和"高均值高方差"能合理对比 — 高方差扣分
        riskAdj: +(mean - 0.5 * stddev).toFixed(2)
      };
    }

    // 自播放规划器 — N 回合循环:抽手牌 → beam 找最佳计划 → 应用 → 跑塌陷事件。
    // 模拟「beam 当玩家」长期表现。每回合用「close temple」事件做塌陷代理。
    function simulateLongRun(opts = {}) {
      const rounds = opts.rounds ?? 5;
      const beamOpts = { depth: opts.beamDepth ?? 2, beamWidth: opts.beamWidth ?? 3, actionCap: opts.actionCap ?? 10 };
      const ruleSet = opts.ruleSet ?? "0.5";
      const destabiliseMode = opts.destabiliseMode ?? "chain-end";
      const eventName = opts.eventName ?? "close";
      const seedFn = opts.seedFn ?? null;

      const original = snapshot();
      if (seedFn) seedFn();

      const history = [];

      for (let round = 0; round < rounds; round++) {
        // 1) 抽手牌
        drawHand();
        const handBefore = [...state.hand];

        // 2) Beam 找最佳计划
        const plans = beamSearchPlans(ruleSet, beamOpts);

        const actionsApplied = [];
        if (plans.length > 0) {
          const topPlan = plans[0];
          for (const action of topPlan.sequence) {
            if (action.type === "puhuarte") continue;
            const ok = applyPlanningAction(action);
            if (!ok) break;
            actionsApplied.push({
              type: action.type,
              cardId: action.cardId,
              pos: action.pos ? { ...action.pos } : null
            });
          }
        }

        const valuePostActions = stateValue(ruleSet);
        const lootMultPostActions = totalScore(ruleSet).lootMult;

        // 3) 跑塌陷事件
        const count = eventCount(ruleSet, eventName);
        applyDestabiliseBatch(count, ruleSet, { mode: destabiliseMode });
        const log = state.destabiliseLog[0];
        const destabilisePicks = log ? log.picks.map(p => ({ key: p.key, mode: p.mode })) : [];

        const valuePostEvent = stateValue(ruleSet);
        const reachable = reachableFromFoyer();
        let hvAlive = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const pos = { row: r, col: c };
          if (!tileAt(pos).destroyed && reachable.has(tileKey(pos)) && roomValue(pos) >= 12) hvAlive++;
        }

        history.push({
          round,
          handBefore,
          actionsApplied,
          valuePostActions,
          lootMultPostActions,
          destabilisePicks,
          valuePostEvent,
          reachable: reachable.size,
          hvAlive
        });
      }

      const final = {
        history,
        finalValue: stateValue(ruleSet),
        finalLootMult: totalScore(ruleSet).lootMult,
        finalReach: reachableFromFoyer().size,
        finalHV: history[history.length - 1]?.hvAlive ?? 0
      };

      restore(original);
      return final;
    }

    // 把 GOAL_TEMPLATE 的 layoutSpec 套到当前 tiles(在 reset+架构师腔室清空之后调用)
    function loadGoalTemplateToTiles(tmpl) {
      if (!tmpl?.layoutSpec) return;
      let architectFound = null;
      for (const e of tmpl.layoutSpec) {
        const tile = tileAt({ row: e.row, col: e.col });
        if (!tile) continue;
        if (isFoyerTile({ row: e.row, col: e.col })) continue;
        tile.content = e.content;
        tile.tier = e.tier ?? 0;
        tile.destroyed = false;
        tile.medallion = e.medallion ?? null;
        tile.rewardLocked = !!e.rewardLocked;
        tile.mods = e.mods ?? 0;
        if (e.content === "architect_chamber") architectFound = { row: e.row, col: e.col };
      }
      // wiki L211 修正:模板若指定 architect_chamber 槽位(如 (0,0) 顶角),直接 sync state.architectPos;
      // 否则保持原 architectPos(reset 时已随机)。
      if (architectFound) state.architectPos = architectFound;
      autoUpgradeAll();
    }

    // 多模板对比分析:对每个 GOAL_TEMPLATE 跑 simulateLongRunMC,返回每个模板的统计数据。
    // 单次访问(initial)与多回合稳态(steady state)分别记录。
    // 用户决策依据:lootMult 高 = 单次收益强;hv 稳 = 抗塌陷强;value 高 = 综合最优。
    function analyzeAllGoalTemplates(opts = {}) {
      const trials = opts.trials ?? 12;
      const rounds = opts.rounds ?? 5;
      const ruleSet = opts.ruleSet ?? el("ruleSet").value;
      const original = snapshot();
      const results = [];
      for (const [id, tmpl] of Object.entries(GOAL_TEMPLATES)) {
        // 加载模板
        resetTemple();
        // resetTemple 后会自动选 architectPos,清掉以免干扰
        if (state.architectPos) clearTile(state.architectPos);
        loadGoalTemplateToTiles(tmpl);
        // initial 状态(模板加载完未被塌陷)的指标
        const initial = totalScore(ruleSet);
        const namedRoomCount = (() => {
          let n = 0;
          for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
            const t = state.tiles[r][c];
            if (!t || t.destroyed) continue;
            const meta = ROOM_TYPES[t.content];
            if (meta?.modBonus?.length || meta?.category === "reward") n++;
          }
          return n;
        })();
        const lockedCount = (() => {
          let n = 0;
          for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
            if (state.tiles[r][c].medallion === "juatalotli") n++;
          }
          return n;
        })();
        // 稳态:跑 simulateLongRunMC,每 trial 用 seedFn 重新加载模板
        const seedSnap = snapshot();
        const sim = simulateLongRunMC({
          rounds,
          beamDepth: 2,
          beamWidth: 3,
          actionCap: 10,
          destabiliseMode: "chain-end",
          eventName: "close",
          seedFn: () => restore(seedSnap)
        }, trials);
        results.push({
          id,
          label: tmpl.label,
          initial: {
            score: Math.round(initial.score),
            lootMult: initial.lootMult,
            namedRoomCount,
            lockedCount,
            reachable: initial.reachable.size,
            atziriReachable: initial.atziriReachable
          },
          steady: sim
        });
      }
      restore(original);
      return { ruleSet, trials, rounds, results };
    }

    function simulateLongRunMC(opts = {}, trials = 30) {
      const data = { values: [], hvs: [], lootMults: [], reaches: [] };
      for (let t = 0; t < trials; t++) {
        const r = simulateLongRun(opts);
        data.values.push(r.finalValue);
        data.hvs.push(r.finalHV);
        data.lootMults.push(r.finalLootMult);
        data.reaches.push(r.finalReach);
      }
      return {
        trials,
        rounds: opts.rounds ?? 5,
        value: distStat(data.values),
        hv: distStat(data.hvs),
        lootMult: distStat(data.lootMults),
        reach: distStat(data.reaches)
      };
    }

    // Monte Carlo 蛇形稳定性 — N 次随机塌陷,报均值/分位/极值。
    // 区别于 simulateSnakeComparison 单次确定运行,本函数用 destabiliseMode="random" 模拟「不知道游戏到底咋选目标」的不确定性。
    function simulateSnakeComparisonMC(opts = {}, trials = 50) {
      const baseOpts = { ...opts, destabiliseMode: "random" };
      const raw = { "0.4": [], "0.5": [] };
      for (let t = 0; t < trials; t++) {
        const result = simulateSnakeComparison(baseOpts);
        raw["0.4"].push(result["0.4"]);
        raw["0.5"].push(result["0.5"]);
      }
      const stats = { trials, opts: baseOpts };
      for (const rs of ["0.4", "0.5"]) {
        const arr = raw[rs];
        stats[rs] = {
          highValueAlive: distStat(arr.map(r => r.highValueAlive)),
          downgraded: distStat(arr.map(r => r.downgraded)),
          removed: distStat(arr.map(r => r.removed)),
          finalReachable: distStat(arr.map(r => r.finalReachable)),
          initialHighValue: arr[0]?.initialHighValue ?? 0,
          initialReachable: arr[0]?.initialReachable ?? 0
        };
      }
      return stats;
    }

    function loadSnakePresetInternal() {
      tilesInit();
      state.medallionPool = { juatalotli: 0, quipolatl: 0, zantipi: 0, puhuarte: 0, estazunti: 0, hayoxi: 0, uromoti: 0 };
      state.hand = [];
      state.destabiliseLog = [];
      state.pendingAssassinateUpgrade = null;
      state.architectPos = null;
      state.royalAccessPos = null;
      // 直线 col 4 chain (8,4) → (0,4),9 tiles strict chain
      const handPath = [
        [8,4],[7,4],[6,4],[5,4],[4,4],[3,4],[2,4],[1,4],[0,4]
      ];
      const types = ["smithy","spymaster","generator","corruption_chamber","thaumaturge","garrison","armoury","commander"];
      for (let i = 0; i < handPath.length; i++) {
        const pos = { row: handPath[i][0], col: handPath[i][1] };
        const tile = tileAt(pos);
        if (i === 0 || i === handPath.length - 1) {
          tile.content = "path"; tile.tier = 0;
        } else if (i % 3 === 1) {
          const t = types[(Math.floor(i / 3)) % types.length];
          const meta = ROOM_TYPES[t];
          tile.content = t;
          tile.tier = Math.min(2, meta.maxTier);
        } else {
          tile.content = "path"; tile.tier = 0;
        }
      }
      // place architect at an isolated empty tile (no chain-tile neighbour) so it doesn't branch the snake
      const isolated = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        if (tileAt(pos).content !== "empty") continue;
        if (adjacentInBounds(pos).every(p => tileAt(p).content === "empty")) isolated.push(pos);
      }
      if (isolated.length) {
        const pick = isolated[Math.floor(rnd() * isolated.length)];
        const tile = tileAt(pick);
        tile.content = "architect_chamber"; tile.tier = 0;
        state.architectPos = pick;
      }
      state.selected = tileKey(FOYER_TILE);
      autoUpgradeAll();
    }

    function loadSnakePreset() {
      loadSnakePresetInternal();
      analyzeAndRender();
    }

    // 多链稀释布局:主链 col 4 + 多条横向 path 支链(默认 row 0/2/4/6 每行铺满 path)。
    // 思路:让大量「假链」格子分担塌陷打击的随机权重。HV 房固定在主链非支链行。
    // 注:本策略假设塌陷算法 random uniform,等长链 → 主链命中 ∝ 主链格数/总格数。
    //     若实际游戏算法 chain-end-first,支链远端反而最先吃 → 仍受益(参见 loadSacrificeLimbInternal)。
    function loadMultiChainInternal(opts = {}) {
      const spurRows = opts.spurRows ?? [0, 2, 4, 6];
      const placeAtziri = opts.placeAtziri !== false;
      const hvPositions = opts.hvPositions ?? [
        { row: 7, col: 4, type: "smithy", tier: 3 },
        { row: 5, col: 4, type: "spymaster", tier: 3 },
        { row: 3, col: 4, type: "generator", tier: 3 }
      ];

      tilesInit();
      state.medallionPool = { juatalotli: 0, quipolatl: 0, zantipi: 0, puhuarte: 0, estazunti: 0, hayoxi: 0, uromoti: 0 };
      state.hand = [];
      state.destabiliseLog = [];
      state.pendingAssassinateUpgrade = null;
      state.architectPos = null;
      state.royalAccessPos = null;

      // Foyer 设为 path(只能直接赋值,绕过 isFoyerTile 防护)
      tileAt(FOYER_TILE).content = "path";
      tileAt(FOYER_TILE).tier = 0;

      // 主链 col 4 全 path(rows 1-7,不动 foyer 和 atziri 行)
      for (let r = 1; r < GRID_SIZE - 1; r++) {
        const t = tileAt({ row: r, col: 4 });
        t.content = "path";
        t.tier = 0;
      }

      // (0,4): atziri_chamber 锁死或仍是 path
      const atzTile = tileAt(ATZIRI_TILE);
      if (placeAtziri) {
        atzTile.content = "atziri_chamber";
        atzTile.tier = 0;
      } else {
        atzTile.content = "path";
        atzTile.tier = 0;
      }

      // 横向支链:在 spurRows 的每一行,col 0-8 全铺 path(跳过 col 4 主链锚和已有 named 房)
      const limbTiles = [];
      for (const r of spurRows) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (c === 4) continue;  // 主链
          const t = tileAt({ row: r, col: c });
          if (t.content !== "empty") continue;
          // 避免覆盖 foyer/atziri
          if (r === FOYER_TILE.row && c === FOYER_TILE.col) continue;
          if (r === ATZIRI_TILE.row && c === ATZIRI_TILE.col) continue;
          t.content = "path";
          t.tier = 0;
          limbTiles.push({ row: r, col: c });
        }
      }

      // 主链 HV 房(覆盖 path)
      for (const { row, col, type, tier } of hvPositions) {
        const meta = ROOM_TYPES[type];
        if (!meta) continue;
        const t = tileAt({ row, col });
        t.content = type;
        t.tier = Math.min(tier ?? 3, meta.maxTier);
      }

      // Architect 在孤立空格
      const isolated = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        if (tileAt(pos).content !== "empty") continue;
        if (adjacentInBounds(pos).every(p => tileAt(p).content === "empty")) isolated.push(pos);
      }
      if (isolated.length) {
        const pick = isolated[Math.floor(rnd() * isolated.length)];
        tileAt(pick).content = "architect_chamber";
        state.architectPos = pick;
      }

      state.selected = tileKey(FOYER_TILE);
      autoUpgradeAll();
      return { hvPositions, limbTiles };
    }

    function loadMultiChainPreset(opts) {
      loadMultiChainInternal(opts);
      analyzeAndRender();
    }

    // 牺牲支链布局:主链同 snake preset,支链从中点 (4,4) 横向铺 N 格 path。
    // 利用「塌陷选最远」机制,支链末端 dist > 主链中段 → 优先吸收塌陷。
    // 注:snake preset 默认把 (0,4) 当 path,这会让它也是 destabilise 候选。本函数把 (0,4)
    // 改成 atziri_chamber(destabiliseEligible=false),让 boss 房真正受保护。
    // 同时 generator 从 (1,4) 挪到 (2,4),让 (1,4) 是 path → atziri 才能通过 path-邻接到达。
    function loadSacrificeLimbInternal(limbLength = 4) {
      loadSnakePresetInternal();
      // 锁定 atziri
      const atzTile = tileAt(ATZIRI_TILE);
      atzTile.content = "atziri_chamber";
      atzTile.tier = 0;
      // 修复 atziri 邻接:generator 从 (1,4) 移到 (2,4),(1,4) 变 path
      const oldGen = { row: 1, col: 4 };
      const newGen = { row: 2, col: 4 };
      const oldT = tileAt(oldGen);
      if (oldT && oldT.content === "generator") {
        const tier = oldT.tier;
        oldT.content = "path"; oldT.tier = 0;
        const newT = tileAt(newGen);
        newT.content = "generator"; newT.tier = tier;
      }
      // 支链从 (4,4) 旁边的 (4,5) 开始横向铺
      const limbTiles = [];
      for (let c = 5; c < 5 + limbLength && c < GRID_SIZE; c++) {
        const pos = { row: 4, col: c };
        const tile = tileAt(pos);
        if (tile.content !== "empty") continue;
        tile.content = "path";
        tile.tier = 0;
        limbTiles.push(pos);
      }
      autoUpgradeAll();
      return { mainSnake: [
        { row: 7, col: 4 }, { row: 4, col: 4 }, { row: 2, col: 4 }
      ], limb: limbTiles };
    }

    // 应用一组塌陷事件,可选支链修复(每事件后)
    // 返回:每事件后 HV 存活数、修复消耗的 path 数、塌陷分布(主链 vs 支链)
    function applyEventCycleWithRepair(opts = {}) {
      const ruleSet = opts.ruleSet ?? "0.5";
      const events = opts.events ?? [
        { name: "enter", count: 2 },
        { name: "architect", count: 1 },
        { name: "atziri", count: 3 },
        { name: "close", count: 1 },
        { name: "close", count: 1 },
        { name: "close", count: 1 }
      ];
      const limbPositions = (opts.limb ?? []).map(p => tileKey(p));
      const repair = opts.repair ?? false;
      const pathBudget = opts.pathBudget ?? Infinity;
      const destabiliseMode = opts.destabiliseMode ?? "random";

      const history = [];
      let pathUsed = 0;
      let limbHits = 0;
      let mainHits = 0;
      const pathBudgetState = { remaining: pathBudget };

      for (const evt of events) {
        const beforeKeys = new Set();
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const t = tileAt({ row: r, col: c });
          if (t && !t.destroyed && t.content !== "empty") beforeKeys.add(tileKey({ row: r, col: c }));
        }
        applyDestabiliseBatch(evt.count, ruleSet, { mode: destabiliseMode });

        // 统计这次塌陷打在哪里
        for (const k of beforeKeys) {
          const pos = parseKey(k);
          const t = tileAt(pos);
          if (t.destroyed || (t.content === "path" && limbPositions.includes(k))) {
            // 注意:downgrade 到 path 也算 hit;destroyed 也算 hit
          }
        }
        // 简化版统计:看 destabiliseLog 最新一条
        const log = state.destabiliseLog[0];
        if (log) {
          for (const pick of log.picks) {
            if (limbPositions.includes(pick.key)) limbHits++;
            else mainHits++;
          }
        }

        // 修复支链(把支链上被 destroyed 或 downgrade 的格子重新铺 path)
        if (repair) {
          for (const k of limbPositions) {
            const pos = parseKey(k);
            const tile = tileAt(pos);
            if (tile.destroyed && pathBudgetState.remaining > 0) {
              // 重新铺 path
              tile.destroyed = false;
              tile.content = "path";
              tile.tier = 0;
              pathUsed++;
              pathBudgetState.remaining--;
            }
            // 0.5 downgrade 到 path 的格子不算 destroyed,无需修复(本来就是 path)
          }
        }

        // 记录本轮 HV 存活
        const reachable = reachableFromFoyer();
        let hvAlive = 0;
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
          const pos = { row: r, col: c };
          const tile = tileAt(pos);
          if (!tile.destroyed && reachable.has(tileKey(pos)) && roomValue(pos) >= 12) hvAlive++;
        }
        history.push({ event: evt.name, hvAlive, pathUsed });
      }

      const reachable = reachableFromFoyer();
      let finalHV = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (!tile.destroyed && reachable.has(tileKey(pos)) && roomValue(pos) >= 12) finalHV++;
      }

      return { history, pathUsed, limbHits, mainHits, finalHV, finalReachable: reachable.size };
    }

    // 3 策略对比 — 直链 vs 直链+支链 vs 直链+支链+修复
    function compareSnakeStrategiesMC(opts = {}, trials = 100) {
      const limbLength = opts.limbLength ?? 4;
      const closeReps = opts.closeReps ?? 3;
      const destabiliseMode = "random";

      const events = [
        { name: "enter", count: 2 },
        { name: "architect", count: 1 },
        { name: "atziri", count: 3 }
      ];
      for (let i = 0; i < closeReps; i++) events.push({ name: "close", count: 1 });

      const results = {
        straight: [],
        limb: [],
        limbRepair: []
      };

      const original = snapshot();

      for (let t = 0; t < trials; t++) {
        // A: straight snake (with atziri lock, to be fair to B/C)
        restore(original);
        loadSnakePresetInternal();
        const atzA = tileAt(ATZIRI_TILE);
        atzA.content = "atziri_chamber"; atzA.tier = 0;
        const a = applyEventCycleWithRepair({ events, limb: [], repair: false, destabiliseMode });
        results.straight.push(a.finalHV);

        // B: with limb, no repair
        restore(original);
        const limbB = loadSacrificeLimbInternal(limbLength).limb;
        const b = applyEventCycleWithRepair({ events, limb: limbB, repair: false, destabiliseMode });
        results.limb.push(b.finalHV);

        // C: with limb, with repair
        restore(original);
        const limbC = loadSacrificeLimbInternal(limbLength).limb;
        const c = applyEventCycleWithRepair({ events, limb: limbC, repair: true, destabiliseMode });
        results.limbRepair.push(c.finalHV);
      }

      restore(original);

      return {
        trials,
        limbLength,
        closeReps,
        straight: distStat(results.straight),
        limb: distStat(results.limb),
        limbRepair: distStat(results.limbRepair)
      };
    }
