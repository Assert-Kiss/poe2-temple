// src/09-strategy.js — 循环助手策略层
// 拼接执行，可访问 01-08 已定义的全局函数（stateGapToTarget, tileAt, ROOM_TYPES, state 等）
(function () {
  "use strict";
  // 后续任务往这里加：STRATEGIES 注册表、makeBlueprintStrategy、桩、loadParams

  // 蓝图 diff：直接复用 05-recommender 的 stateGapToTarget（读全局 state）
  // blueprint = GOAL_TEMPLATES 里的 target 对象（含 layoutSpec）
  function computeBlueprintDiff(blueprint) {
    return stateGapToTarget(blueprint);  // {gaps, totalSpec, matchedSpec, progress, milestones}
  }
  window.__strategyLayer = { computeBlueprintDiff };

  // 判定一个蓝图格是否「核心」（高价值，优先级最高）：高 tier
  function isCoreCell(want) {
    return (want.tier ?? 0) >= 3;
  }

  // 蓝图对齐策略工厂。config = { blueprint }
  function makeBlueprintStrategy(config) {
    const blueprint = config.blueprint;
    return function strategy(state, params) {
      // 注意：缺口拓扑由 computeBlueprintDiff 读「全局 state」算出，而库存读传入的 state 参数。
      // 当前所有调用方都传 sim.state（全局===参数），一致。若将来传非全局快照做 what-if，需先把 diff 也参数化。
      const { gaps } = computeBlueprintDiff(blueprint);
      const handLeft = { ...(state.handInventory || {}) };   // 不消耗真实库存
      const actions = [];

      for (const g of gaps) {
        const want = blueprint.layoutSpec.find(s => s.row === g.pos.row && s.col === g.pos.col);
        if (!want) continue;
        const core = isCoreCell(want);

        if (g.missing === "content") {
          if (g.have === "destroyed") {
            // 塌陷格 → 修（有牌才修）
            if ((handLeft[g.want] || 0) > 0) {
              handLeft[g.want] -= 1;
              actions.push({
                type: "repair", pos: g.pos, room: g.want, tier: 1, handCard: g.want,
                priority: core ? 1 : 4,
                reason: core ? "核心格上次塌陷，优先修" : "shell 格塌陷，补回"
              });
            }
          } else if (g.have === "empty") {
            // 空格 → 放（有牌才放）
            if ((handLeft[g.want] || 0) > 0) {
              handLeft[g.want] -= 1;
              actions.push({
                type: "place", pos: g.pos, room: g.want, tier: 1, handCard: g.want,
                priority: core ? 2 : 5,
                reason: core ? "核心空格，按蓝图放" : "shell 空格，按蓝图填"
              });
            }
          } else {
            // 错房占用（非空非塌陷）→ 不能放牌，提示等塌陷清出
            actions.push({
              type: "skip", pos: g.pos, room: g.want, tier: 0, handCard: null,
              priority: 7,
              reason: `(${g.pos.row},${g.pos.col}) 被别的房占着，要等塌陷清掉才能放蓝图要的 ${g.want}`
            });
          }
        } else if (g.missing === "tier") {
          // 蓝图要更高 tier，当前不够。本期不主动升级（靠邻接自动升级/升阶纹章），给提示不让它从清单消失
          actions.push({
            type: "skip", pos: g.pos, room: want.content, tier: want.tier ?? 0, handCard: null,
            priority: 8,
            reason: `${want.content} 要升到 T${want.tier}（现 T${g.have}），靠邻接自动升级或攒升阶纹章`
          });
        }
        // 注：medallion/rewardLock gap 分支已移除（0.5 PN juatalotli 废除）
      }
      // 无放法：库存里还有、但蓝图没给落点的卡 → skip，老实给原因
      const placedCount = {};
      for (const a of actions) {
        if (a.handCard) placedCount[a.handCard] = (placedCount[a.handCard] || 0) + 1;
      }
      for (const [card, count] of Object.entries(state.handInventory || {})) {
        if (card === "path") continue;  // 通路总能填诱饵，不算无放法
        const used = placedCount[card] || 0;
        const leftover = count - used;
        if (leftover > 0) {
          const inBlueprint = blueprint.layoutSpec.some(s => s.content === card);
          actions.push({
            type: "skip", pos: null, room: card, tier: 0, handCard: null,
            priority: 9,
            reason: inBlueprint
              ? "蓝图有这房但当前无合法落点（链没扩到/已满），下轮再放"
              : "蓝图里没这房，本策略用不上，可强放占格或丢弃"
          });
        }
      }
      actions.sort((a, b) => a.priority - b.priority);
      return actions;
    };
  }
  window.__strategyLayer.makeBlueprintStrategy = makeBlueprintStrategy;
  window.__strategyLayer.isCoreCell = isCoreCell;

  // ========================================================================
  // 动态最优策略 —— 从当前残局出发，顺序贪心最大化「当前可达即时 lootMult」。
  // 不靠预知塌陷规则：每轮枚举此刻能做的 place/repair/upgrade，挑 lootMult 增量最大
  // 且 >0 的一步，应用到工作副本，再进下一轮，直到没有正增量动作 / 资源耗尽 / 步数封顶。
  //
  // 协同(放大器覆盖 / Generator 供能 / 升级邻接)由顺序贪心**自然吃到**——放完 Generator 后
  // 旁边 Smithy 的 place/upgrade 增量会涨,下一轮被优先选。不手写协同规则:重算 lootMult 即体现。
  //
  // 回补:残局的 destroyed 格 + 降级来的 path 格天然是落点候选(枚举自然覆盖)。每个 place 落点
  // 算 wouldDisconnect:断链位被塌会降级成通路(房没了路还在)→ reason 标注让用户知道要每轮补;
  // 非断链位被塌是整删。断链位仍按即时 lootMult 增量评估(接受周期降级),delta≤0 就不建议。
  // ========================================================================

  // —— 工作副本机制 ——
  // 现有 lootMult / computeModStack / totalScore 都读「全局 state」。为零副作用地在副本上算,
  // 复用引擎现成的 snapshot()/restore() 全量 JSON 深拷贝(MC 模拟同款,久经验证):
  //   入口:realSnap = snapshot() 把整盘真实 state 存下;之后所有模拟**就地改全局 state**(全局即副本)。
  //   出口:restore(realSnap) 把全局 state 逐字段还原 —— tiles / handInventory / medallionPool 与调用前逐字段一致。
  // 单个候选评估也用 snapshot/restore 包裹,保证「试放 → 算分 → 撤销」干净无残留。
  // 选 snapshot/restore 而非参数化 score 路径:不改 02-scoring.js(cross-val fixture 不用重生)、
  // 复用 placeRoom/canUpgrade/wouldDisconnect/totalScore 原函数(零签名改动、零 parity 风险)。

  const DYN_RULESET = "0.5";       // 动态最优固定按 0.5 规则算 lootMult(不读 el("ruleSet"),纯函数化)
  const DYN_STEP_CAP = 40;         // 步数上限,防失控/死循环

  // —— 候选评估的轻量级 save/restore ——
  // 出入口的「真实盘面整体还原」用引擎的全量 snapshot()/restore()(只跑 2 次,稳)。
  // 但每个候选「试放→算分→撤销」若也整盘 JSON 深拷贝,会把 destabiliseLog / probeLog / 各种
  // 比较结果一起拷,候选数一多就慢。候选评估只改 tiles(+ upgrade 改 medallionPool.quipolatl;
  // 房卡里没有 architect_chamber,故 architectPos 不会变),所以只保存/还原这几项即可,等价且快很多。
  function saveCandState() {
    const tiles = new Array(GRID_SIZE);
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = new Array(GRID_SIZE);
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = state.tiles[r][c];
        row[c] = { content: t.content, tier: t.tier, manualWeight: t.manualWeight, medallion: t.medallion, mods: t.mods, destroyed: t.destroyed, rewardLocked: t.rewardLocked, assassinateUpgraded: t.assassinateUpgraded };
      }
      tiles[r] = row;
    }
    return { tiles, quipolatl: (state.medallionPool && state.medallionPool.quipolatl) || 0 };
  }
  function restoreCandState(saved) {
    for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
      Object.assign(state.tiles[r][c], saved.tiles[r][c]);
    }
    if (state.medallionPool) state.medallionPool.quipolatl = saved.quipolatl;
  }

  // 当前工作副本的 lootMult(读全局 state)。
  function currentLootMult() {
    return totalScore(DYN_RULESET).lootMult;
  }

  // 落点合法性:空格 / 塌掉(destroyed) / 降级来的 path 格 —— 这三类是 place/repair 的候选格。
  // (path 格虽非空非 destroyed,但解包/PN 定:降级来的 path 是回补落点,placeRoom 也允许覆盖它。)
  function isLandingCell(pos) {
    if (isFoyerTile(pos)) return false;          // 入口永久锁定,不放
    const tile = tileAt(pos);
    if (!tile) return false;
    if (tile.rewardLocked) return false;          // console 房不可覆盖
    if (tile.destroyed) return true;              // 塌掉 → 可重建(回补)
    if (tile.content === "empty") return true;    // 空格
    if (tile.content === "path") return true;     // 降级来的 path 格(回补)
    return false;                                  // 其它房占着 → 不能放(等塌陷清出)
  }

  // 试着在 pos 放 room(tier 1)并跑 autoUpgradeAll(=playCard 路径:放完立刻吃邻接升级/转换),
  // 返回 { ok, lootMult } —— 不可放(链限制 / 放完不连通)时 ok=false。
  // 调用方负责 save/restore 包裹;本函数只就地改全局并量测,不自行撤销。
  // 注:断链位(wouldDisconnect)只对**最终选中**的一步算一次(见 strategy 主循环),不在枚举里逐候选算
  // —— wouldDisconnect 每次跑两遍 reachableFromFoyer,候选一多就成热点;延后算等价且快很多。
  function tryPlaceAndScore(pos, room) {
    const res = placeRoom(pos, room, 1);
    if (!res || !res.ok) return { ok: false };    // canPlaceRoom 链限制(notConnectableInChainWith)挡住
    autoUpgradeAll();                              // 邻接自动升级 + Garrison 转换,与放卡一致
    const reachable = reachableFromFoyer();
    if (!reachable.has(tileKey(pos))) return { ok: false };  // 放完没连到入口链 → 不贡献,不建议
    const lootMult = totalScore(DYN_RULESET).lootMult;
    return { ok: true, lootMult };
  }

  // 试着用一张升阶纹章把 pos 的房升一档(consumeQuipolatl 内含 tier+1 + autoUpgradeAll),
  // 返回 { ok, lootMult }。调用方负责 snapshot/restore。
  function tryUpgradeAndScore(pos) {
    const ok = consumeQuipolatl(pos);
    if (!ok) return { ok: false };
    const lootMult = totalScore(DYN_RULESET).lootMult;
    return { ok: true, lootMult };
  }

  function roomLabelOf(id) {
    return (ROOM_TYPES[id] && ROOM_TYPES[id].label) || id;
  }

  // 把 +delta 写成「+X.X% loot」的白话(lootMult 是乘式,delta 直接是倍率增量)。
  function fmtDelta(delta) {
    return `+${(delta * 100).toFixed(1)}% loot`;
  }

  // 枚举本轮所有候选动作(在当前工作副本上),返回打过分的候选数组。
  //   handLeft:剩余手牌房卡计数(本策略不消耗真实库存,用本地副本计数)
  //   quipoLeft:剩余升阶纹章数
  //   baseLoot:本轮起点 lootMult
  function enumerateCandidates(handLeft, quipoLeft, baseLoot) {
    const cands = [];

    // 1) place / repair：每张手牌房卡 × 每个合法落点
    const cardIds = Object.keys(handLeft).filter(id => id !== "path" && (handLeft[id] || 0) > 0);
    if (cardIds.length) {
      const landings = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        if (isLandingCell(pos)) landings.push(pos);
      }
      for (const room of cardIds) {
        for (const pos of landings) {
          const tileBefore = tileAt(pos);
          const isRepair = !!tileBefore && (tileBefore.destroyed || tileBefore.content === "path");
          const saved = saveCandState();
          const sim = tryPlaceAndScore(pos, room);
          let cand = null;
          if (sim.ok) {
            const delta = sim.lootMult - baseLoot;
            cand = {
              type: isRepair ? "repair" : "place",
              pos, room, handCard: room, tier: 1,
              delta, disconnects: false, isRepair   // disconnects 在选中后才算(见主循环)
            };
          }
          restoreCandState(saved);
          if (cand) cands.push(cand);
        }
      }
    }

    // 2) upgrade：每个 canUpgrade(pos).ok 的房,用 1 张升阶纹章升一档(quipolatl 驱动)。
    //    canUpgrade 已校验邻接/供能/封顶;再要求 quipoLeft>0 才是玩家此刻能做的升级。
    if (quipoLeft > 0) {
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (!tile || tile.destroyed || tile.content === "empty" || tile.content === "path") continue;
        if (!canUpgrade(pos).ok) continue;
        // 在 snapshot/mutate 前就把房型 + 当前 tier 拷成值:consumeQuipolatl 会改 tile.tier,
        // restoreCandState 是就地 Object.assign 还原(不换数组),拷成值更稳、免读到中间态。
        const roomHere = tile.content;
        const tierBefore = tile.tier || 0;
        const saved = saveCandState();
        const sim = tryUpgradeAndScore(pos);
        let cand = null;
        if (sim.ok) {
          cand = { type: "upgrade", pos, room: roomHere, handCard: null, tier: tierBefore + 1, delta: sim.lootMult - baseLoot, disconnects: false };
        }
        restoreCandState(saved);
        if (cand) cands.push(cand);
      }
    }

    return cands;
  }

  // 给选中的动作写 reason(白话:为什么这步 + 增量多少 + 是否断链位回补)。
  function buildReason(cand) {
    const name = roomLabelOf(cand.room);
    const gain = fmtDelta(cand.delta);
    if (cand.type === "upgrade") {
      return `升 ${name} 到 T${cand.tier}(用升阶纹章),即时收益 ${gain},此刻增量最高`;
    }
    const verb = cand.isRepair ? "回补" : "放";
    const where = cand.isRepair ? "(残局空出的格)" : "";
    let reason = `${verb} ${name}${where},即时收益 ${gain},此刻增量最高`;
    if (cand.disconnects) {
      reason += "。断链位:放这若被塌会**降级成通路**(房没了路还在),会周期降级,准备每轮补";
    }
    return reason;
  }

  // 动态最优策略工厂。config = { blueprint }(blueprint 本期不读,留接口与蓝图策略一致)。
  function makeDynamicOptimalStrategy(config) {
    return function strategy(state, params) {
      // 注意:所有现有调用方传入的 state 参数 === 模块全局 state(同一对象)。本策略 snapshot/restore
      // 操作的是模块全局 state,与参数一致。若将来传非全局快照,需先把 snapshot/restore 也参数化。
      // MVP 不依赖塌陷假设(纯即时可达 loot)。params.collapseMode / params.probeLog 留接口本期不读。
      // TODO(塌陷数据攒够后):在此对断链位 / 落点按「被塌概率」做风险加权,折算到 delta(见 probeLog)。

      const realSnap = snapshot();   // 存真实盘面;出口 restore,保证真实 state 逐字段不变
      const actions = [];
      try {
        // 本策略不消耗真实库存:用本地计数副本扣减(全局 state 当工作盘面,出口整体还原)。
        const handLeft = { ...(state.handInventory || {}) };
        let quipoLeft = (state.medallionPool && state.medallionPool.quipolatl) || 0;

        for (let step = 0; step < DYN_STEP_CAP; step++) {
          // 资源耗尽(手里无房卡且无升阶纹章)→ 收工
          const cardsLeft = Object.keys(handLeft).some(id => id !== "path" && (handLeft[id] || 0) > 0);
          if (!cardsLeft && quipoLeft <= 0) break;

          const baseLoot = currentLootMult();
          const cands = enumerateCandidates(handLeft, quipoLeft, baseLoot);
          if (!cands.length) break;

          // 选 delta 最大且 >0 的;同 delta 取靠前(稳定:按 pos row-major)。delta≤0 全不建议 → 停。
          cands.sort((a, b) =>
            (b.delta - a.delta) ||
            ((a.pos.row * GRID_SIZE + a.pos.col) - (b.pos.row * GRID_SIZE + b.pos.col)));
          const best = cands[0];
          if (!(best.delta > 0)) break;   // 无正增量 → 停,不盲目重复(防死循环)

          // 实际应用到工作副本(持久),消耗副本手牌 / 纹章
          if (best.type === "upgrade") {
            consumeQuipolatl(best.pos);
            quipoLeft -= 1;
          } else {
            placeRoom(best.pos, best.room, 1);
            autoUpgradeAll();
            handLeft[best.handCard] = (handLeft[best.handCard] || 0) - 1;
            // 断链位判定只对选中的这一步算一次(放完后的盘面):被塌→降级成通路,要每轮补。
            best.disconnects = wouldDisconnect(best.pos);
          }

          actions.push({
            type: best.type,
            pos: best.pos,
            room: best.room,
            tier: best.tier,
            handCard: best.handCard,
            priority: actions.length,   // 应用顺序 = 增量降序,0,1,2…
            reason: buildReason(best)
          });
        }
      } finally {
        restore(realSnap);   // 硬性要求:无论如何还原真实盘面(tiles/handInventory/medallionPool 逐字段一致)
      }

      // 不再是桩:不打 __pending。
      return actions;
    };
  }

  // 策略注册表：key → 工厂函数(config) → strategy(state, params)
  const STRATEGIES = {
    "blueprint-align": makeBlueprintStrategy,
    "dynamic-optimal": makeDynamicOptimalStrategy
  };
  window.__strategyLayer.STRATEGIES = STRATEGIES;
  window.__strategyLayer.makeDynamicOptimalStrategy = makeDynamicOptimalStrategy;

  // 把校准摘要(calibration-summary.json 的对象)转成策略 params。null=未校准。
  function loadStrategyParams(calibrationSummary) {
    let collapseMode = null;
    const post = calibrationSummary && calibrationSummary.mode_posterior;
    if (post && typeof post === "object") {
      const entries = Object.entries(post);
      if (entries.length) {
        collapseMode = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
      }
    }
    return {
      collapseMode,
      closeRatio: 0.10   // PLACEHOLDER-05: close 塌陷比例，与 monte_carlo / visit_loop 同源，待实测替换
    };
  }
  window.__strategyLayer.loadStrategyParams = loadStrategyParams;
})();
