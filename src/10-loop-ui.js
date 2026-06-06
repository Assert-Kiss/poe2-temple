// src/10-loop-ui.js — 循环助手 UI 层（消费 09 策略层）
(function () {
  "use strict";
  window.__loopUI = {};

  // 任务 8b-2:关庙标记模式状态。markMode 暴露在 __loopUI 供 08-ui 点击劫持读取；
  // collapseMarks 模块内累积，确认时一次性 applyCollapseMarks。
  window.__loopUI.markMode = false;
  let collapseMarks = [];

  // 傻瓜塌陷实测器:每次关庙确认时,在 applyCollapseMarks 之前把每个标记格记成一条观测,
  // 整批作为一个 batch 存进 state.probeLog。挂进 saveLoopState/loadLoopState 持久化。
  // 只采集塌陷选点(选点+数量),不碰纹章掉率(用户定:掉率非建模目标)。
  // batch 形状: { reachBefore, ts, obs:[{distance,isPath,isCutVertex,result}] }
  //   result: "remove"(红/塌掉) | "downgrade"(黄/变通路)
  function ensureProbeLog() {
    if (!Array.isArray(state.probeLog)) state.probeLog = [];
    return state.probeLog;
  }
  window.__loopUI.ensureProbeLog = ensureProbeLog;

  const LOOP_KEY = "poe2temple.loop";
  function saveLoopState(storage) {
    const snap = {
      tiles: state.tiles.map(row => row.map(t => ({ content: t.content, tier: t.tier, destroyed: t.destroyed, medallion: t.medallion, rewardLocked: t.rewardLocked, assassinateUpgraded: t.assassinateUpgraded, mods: t.mods }))),
      handInventory: { ...(state.handInventory || {}) },
      medallionPool: { ...(state.medallionPool || {}) },
      visitCount: state.visitCount || 0,
      probeLog: ensureProbeLog()
    };
    storage.setItem(LOOP_KEY, JSON.stringify(snap));
  }
  function loadLoopState(storage) {
    const raw = storage.getItem(LOOP_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    for (let r = 0; r < snap.tiles.length; r++) for (let c = 0; c < snap.tiles[r].length; c++) {
      if (!state.tiles[r] || !state.tiles[r][c]) continue;  // 维度边界防御:快照网格大于当前网格时跳过
      Object.assign(state.tiles[r][c], snap.tiles[r][c]);
    }
    state.handInventory = { ...snap.handInventory };
    state.medallionPool = { ...state.medallionPool, ...snap.medallionPool };
    state.visitCount = snap.visitCount || 0;
    state.probeLog = Array.isArray(snap.probeLog) ? snap.probeLog : [];
    return true;
  }
  window.__loopUI.saveLoopState = saveLoopState;
  window.__loopUI.loadLoopState = loadLoopState;

  // marks: [{row,col,kind:"collapsed"|"downgraded"}]。collapsed→清空(destroyed)，downgraded→降为 path。
  function applyCollapseMarks(marks) {
    for (const m of (marks || [])) {
      const t = state.tiles[m.row] && state.tiles[m.row][m.col];
      if (!t) continue;
      if (m.kind === "collapsed") {
        t.destroyed = true; t.content = "empty"; t.tier = 0; t.medallion = null; t.rewardLocked = false;
      } else if (m.kind === "downgraded") {
        t.content = "path"; t.tier = 0; t.medallion = null; t.rewardLocked = false; t.destroyed = false;
      }
    }
    state.visitCount = (state.visitCount || 0) + 1;
  }
  window.__loopUI.applyCollapseMarks = applyCollapseMarks;

  // 在 applyCollapseMarks 之前调用:对每个标记格按当前(确认前)拓扑算一条观测,整批入 probeLog。
  // 字段口径与 08-ui 的 calibrationObservationFromSelected 一致(同一套 reachableFromFoyer /
  // tileChainDistance / wouldDisconnect),保证浏览器端口分析与 analyze_observations.py 同源。
  // marks: [{row,col,kind:"collapsed"|"downgraded"}]。collapsed→result "remove",downgraded→"downgrade"。
  function captureProbeBatch(marks) {
    const list = Array.isArray(marks) ? marks : [];
    if (!list.length) return null;  // 空确认不记观测(但 applyCollapseMarks 仍算一次 visit)
    const reachable = (typeof reachableFromFoyer === "function") ? reachableFromFoyer() : new Set();
    const dist = (typeof tileChainDistance === "function") ? tileChainDistance() : new Map();
    const obs = [];
    for (const m of list) {
      const pos = { row: m.row, col: m.col };
      const tile = (typeof tileAt === "function") ? tileAt(pos) : (state.tiles[m.row] && state.tiles[m.row][m.col]);
      if (!tile) continue;
      const key = `${m.row},${m.col}`;
      const d = dist.has(key) ? dist.get(key) : null;
      obs.push({
        distance: (typeof d === "number") ? d : null,
        isPath: !tile.destroyed && tile.content === "path",
        isCutVertex: (reachable.has(key) && typeof wouldDisconnect === "function")
          ? wouldDisconnect(pos, reachable) : false,
        result: m.kind === "downgraded" ? "downgrade" : "remove",
      });
    }
    if (!obs.length) return null;
    const batch = { reachBefore: reachable.size, ts: Date.now(), obs };
    ensureProbeLog().push(batch);
    return batch;
  }
  window.__loopUI.captureProbeBatch = captureProbeBatch;

  // 清空实测数据(「重置实测数据」按钮)+ 持久化。
  function resetProbeLog() {
    state.probeLog = [];
    if (typeof window !== "undefined" && window.localStorage) {
      try { saveLoopState(window.localStorage); } catch (e) { /* 持久化失败不阻断 UI */ }
    }
  }
  window.__loopUI.resetProbeLog = resetProbeLog;

  // ============================================================
  // 浏览器端口分析(faithful port of sim/analyze_observations.py)
  // ------------------------------------------------------------
  // 只用 result ∈ {remove,downgrade} 且 distance 为数字的观测。dmax = max(观测距离, 1)。
  // 诚实限制(原样保留 py 注释精神):真实 9x9 网格距离分布是钟形,uniform random 的
  // 钟形被塌结果会被模型误判为略偏 weighted → random↔weighted 内部区分【不可靠】。
  // 故只报合并的「非 chain-end(Plan A)」概率 + chain-end 概率,不报 random/weighted 谁高。
  // ============================================================
  const PROBE_TARGET_N = 20;   // = analyze_observations.py 的 TARGET_N
  const PROBE_PRIORS = { random: 0.45, weighted: 0.45, "chain-end": 0.10 };

  // 把 probeLog(batch 列表)摊平成观测列表。
  function flattenProbeLog(probeLog) {
    const out = [];
    for (const b of (probeLog || [])) {
      for (const o of (b && b.obs) || []) out.push(o);
    }
    return out;
  }

  // mode 选到 distance=d 的概率密度(简化模型,逐行对齐 py mode_pdf)。
  function modePdf(mode, d, dmax) {
    if (dmax < 1) return 1e-9;
    if (mode === "random") return 1.0 / (dmax + 1);
    if (mode === "weighted") {
      let total = 0;
      for (let i = 0; i <= dmax; i++) total += i + 1;
      return (d + 1) / total;
    }
    if (mode === "chain-end") {
      if (d === dmax) return 0.70;
      if (d === dmax - 1) return 0.20;
      if (d < dmax - 1) return 0.10 / Math.max(1, dmax - 1);
      return 1e-9;
    }
    return 1e-9;
  }

  // 对所有观测算各 mode 的 log-likelihood 之和(对齐 py compute_mode_likelihoods)。
  function computeModeLikelihoods(observations) {
    const relevant = observations.filter(o =>
      (o.result === "remove" || o.result === "downgrade") && typeof o.distance === "number");
    if (!relevant.length) return { random: 0, weighted: 0, "chain-end": 0, n: 0, dmax_obs: 0 };
    let dmax = 1;
    for (const o of relevant) if (o.distance > dmax) dmax = o.distance;
    const logLik = { random: 0, weighted: 0, "chain-end": 0 };
    for (const o of relevant) {
      for (const mode of ["random", "weighted", "chain-end"]) {
        const p = Math.max(modePdf(mode, o.distance, dmax), 1e-9);
        logLik[mode] += Math.log(p);
      }
    }
    logLik.n = relevant.length;
    logLik.dmax_obs = dmax;
    return logLik;
  }

  // Log-likelihood → 后验概率(对齐 py likelihoods_to_posterior,减最大值防溢出)。
  function likelihoodsToPosterior(logLik, priors) {
    priors = priors || PROBE_PRIORS;
    const modes = ["random", "weighted", "chain-end"];
    const logPost = {};
    for (const m of modes) logPost[m] = logLik[m] + Math.log(priors[m]);
    let mx = -Infinity;
    for (const m of modes) if (logPost[m] > mx) mx = logPost[m];
    const post = {};
    let total = 0;
    for (const m of modes) { post[m] = Math.exp(logPost[m] - mx); total += post[m]; }
    for (const m of modes) post[m] = post[m] / total;
    return post;
  }

  // path 命中率(对齐 py path_hit_stats)。
  function pathHitStats(observations) {
    const relevant = observations.filter(o => o.result === "remove" || o.result === "downgrade");
    if (!relevant.length) return { path_hit_rate: null, n_path_hit: 0, n_total: 0 };
    const hit = relevant.filter(o => o.isPath).length;
    return { path_hit_rate: Math.round((hit / relevant.length) * 1000) / 1000, n_path_hit: hit, n_total: relevant.length };
  }

  // cut vertex 命中时 result 分布(对齐 py cut_vertex_behavior)。
  function cutVertexBehavior(observations) {
    const cv = observations.filter(o => o.isCutVertex);
    if (!cv.length) return { n: 0, note: "还没记到断点(cut vertex)塌陷样本" };
    let dg = 0, rm = 0;  // 实测只产生 remove/downgrade(无 skip:0.5 锁牌已废,不挡塌陷)
    for (const o of cv) { if (o.result === "downgrade") dg++; else if (o.result === "remove") rm++; }
    const round2 = x => Math.round(x * 100) / 100;
    return {
      n_cut_vertex_hits: cv.length,
      ratio_downgrade: round2(dg / cv.length),
      ratio_skip: 0,
      ratio_remove: round2(rm / cv.length),
    };
  }

  // 距离直方图(对齐 py distance_histogram),返回 {distance: count} 升序。
  function distanceHistogram(observations) {
    const h = {};
    for (const o of observations) {
      if ((o.result === "remove" || o.result === "downgrade") && typeof o.distance === "number") {
        h[o.distance] = (h[o.distance] || 0) + 1;
      }
    }
    return h;
  }

  // 推荐(对齐 py recommend):status ∈ PENDING / AMBIGUOUS / PLAN_A / CHAIN_END,n<TARGET_N → low_confidence。
  function recommendProbe(posterior, n) {
    const lowConf = n < PROBE_TARGET_N;
    const ret = (d) => {
      d.confidence = lowConf ? "low" : "ok";
      d.low_confidence = lowConf;
      d.n_target = PROBE_TARGET_N;
      return d;
    };
    if (n < 10) {
      return ret({ status: "PENDING", message: `PENDING: 样本 ${n}/10,数据不足` });
    }
    const pPlanA = posterior.random + posterior.weighted;
    const pPlanB = posterior["chain-end"];
    if (pPlanA > 0.75) {
      return ret({ status: "PLAN_A", message: `PLAN_A: P(非chain-end)=${pPlanA.toFixed(2)}`, p_plan_a: pPlanA });
    }
    if (pPlanB > 0.5) {
      return ret({ status: "CHAIN_END", message: `CHAIN_END: chain-end p=${pPlanB.toFixed(2)}`, p_plan_b: pPlanB });
    }
    return ret({ status: "AMBIGUOUS", message: `AMBIGUOUS: P(A)=${pPlanA.toFixed(2)} P(B)=${pPlanB.toFixed(2)}`, p_plan_a: pPlanA, p_plan_b: pPlanB });
  }

  // 顶层分析入口:probeLog → { n, batches, dmax, posterior, pathHit, cutVertex, histogram, recommendation, avgPerClose }
  function analyzeProbe(probeLog) {
    const log = probeLog || ensureProbeLog();
    const observations = flattenProbeLog(log);
    const logLik = computeModeLikelihoods(observations);
    const posterior = logLik.n > 0
      ? likelihoodsToPosterior(logLik)
      : { random: 0, weighted: 0, "chain-end": 0 };
    const rec = recommendProbe(posterior, logLik.n);
    const batches = log.length;
    // 平均每次关庙塌几格 = 总观测点 / batch 数(只数有观测的 batch;空确认不入 log)。
    const avgPerClose = batches > 0 ? observations.length / batches : 0;
    return {
      n: logLik.n,
      nObservations: observations.length,
      batches,
      dmax: logLik.dmax_obs || 0,
      posterior,
      pathHit: pathHitStats(observations),
      cutVertex: cutVertexBehavior(observations),
      histogram: distanceHistogram(observations),
      recommendation: rec,
      avgPerClose,
    };
  }
  window.__loopUI.analyzeProbe = analyzeProbe;
  // 端口子函数也暴露,供测试逐个对齐 analyze_observations.py。
  window.__loopUI.modePdf = modePdf;
  window.__loopUI.computeModeLikelihoods = computeModeLikelihoods;
  window.__loopUI.likelihoodsToPosterior = likelihoodsToPosterior;
  window.__loopUI.recommendProbe = recommendProbe;
  window.__loopUI.flattenProbeLog = flattenProbeLog;

  // ---- 道具库存输入面板（数据驱动，参 combat-v4.html 左栏）----

  // 纹章名映射：juatalotli/quipolatl 带图标，其余尽量取核心层的中文名，再退回 key。
  const MED_LABEL_OVERRIDE = { juatalotli: "🔒 锁牌", quipolatl: "⬆ 升阶" };
  function medallionLabel(key) {
    if (MED_LABEL_OVERRIDE[key]) return MED_LABEL_OVERRIDE[key];
    if (typeof MEDALLION_LABEL !== "undefined" && MEDALLION_LABEL[key]) return MEDALLION_LABEL[key];
    if (typeof MEDALLION_SHORT !== "undefined" && MEDALLION_SHORT[key]) return MEDALLION_SHORT[key];
    return key;
  }

  // 可手放的房：排除 oneShot / fixedSlot / 入口。path（通路）本就在数据里且符合条件，直接保留。
  function handDrawableRooms() {
    const data = (typeof TEMPLE_DATA !== "undefined" && TEMPLE_DATA) || (typeof window !== "undefined" && window.TEMPLE_DATA);
    if (!data || !Array.isArray(data.rooms)) return [];
    return data.rooms.filter(r => r.oneShot !== true && r.fixedSlot !== true && r.id !== "entrance");
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function itemCellHtml(kind, id, label, count) {
    const active = count > 0 ? " active" : "";
    const nameHtml = escapeAttr(label).replace(/\n/g, "<br>");
    return `<div class="item-cell${active}" data-kind="${escapeAttr(kind)}" data-id="${escapeAttr(id)}">`
      + `<div class="name">${nameHtml}</div><div class="count">${count}</div></div>`;
  }

  function renderInventory() {
    const container = (typeof document !== "undefined" && document.getElementById)
      ? document.getElementById("loopInventory") : null;
    if (!container) return;

    const hand = state.handInventory || (state.handInventory = {});
    const pool = state.medallionPool || (state.medallionPool = {});

    const rooms = handDrawableRooms();
    let handCount = 0;
    const handCells = rooms.map(r => {
      const n = hand[r.id] || 0;
      handCount += n;
      return itemCellHtml("hand", r.id, r.name_zh || r.id, n);
    }).join("");

    const medCells = Object.keys(pool).map(key =>
      itemCellHtml("medallion", key, medallionLabel(key), pool[key] || 0)
    ).join("");

    container.innerHTML =
      `<div class="inv-group">`
      + `<div class="inv-label">手牌（点格子循环 0→3）</div>`
      + `<div class="item-grid">${handCells}</div>`
      + `<div class="inv-tally">合计 ${handCount}</div>`
      + `</div>`
      + `<div class="inv-group">`
      + `<div class="inv-label">纹章库存</div>`
      + `<div class="item-grid">${medCells}</div>`
      + `</div>`;

    // 事件委托：容器上挂一次 click，读 data-kind / data-id。
    if (!container.__loopInvBound && typeof container.addEventListener === "function") {
      container.addEventListener("click", onInventoryClick);
      container.__loopInvBound = true;
    }
  }

  function onInventoryClick(ev) {
    const target = ev.target;
    const cell = (target && typeof target.closest === "function") ? target.closest(".item-cell") : null;
    if (!cell) return;
    const kind = cell.dataset ? cell.dataset.kind : cell.getAttribute && cell.getAttribute("data-kind");
    const id = cell.dataset ? cell.dataset.id : cell.getAttribute && cell.getAttribute("data-id");
    if (!kind || !id) return;

    // 循环上限 10(0-9),覆盖实际锁牌/手牌范围(一般 <10),
    // 避免 %4 把真实计数(如纹章 5)截断到 2/3。
    if (kind === "hand") {
      state.handInventory = state.handInventory || {};
      state.handInventory[id] = ((state.handInventory[id] || 0) + 1) % 10;
    } else if (kind === "medallion") {
      state.medallionPool = state.medallionPool || {};
      state.medallionPool[id] = ((state.medallionPool[id] || 0) + 1) % 10;
    } else {
      return;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try { saveLoopState(window.localStorage); } catch (e) { /* 持久化失败不阻断 UI */ }
    }
    renderInventory();
  }

  window.__loopUI.renderInventory = renderInventory;

  // 用指定策略 + 蓝图模板生成行动清单数据（供 UI 渲染）。
  function buildActionChecklist(strategyKey, blueprintKey) {
    const blueprint = GOAL_TEMPLATES[blueprintKey];
    const factory = window.__strategyLayer.STRATEGIES[strategyKey] || window.__strategyLayer.STRATEGIES["blueprint-align"];
    const params = window.__strategyLayer.loadStrategyParams(window.__calibrationSummary || null);
    const strategy = factory({ blueprint });
    const actions = strategy(state, params);
    return { actions, pending: actions.__pending === true, strategyKey, blueprintKey, collapseMode: params.collapseMode };
  }
  window.__loopUI.buildActionChecklist = buildActionChecklist;

  // ---- 行动清单渲染（消费 buildActionChecklist，参 combat-v4.html 右栏）----

  // 策略 key → 中文标签；未知 key 直接用 key。
  const STRATEGY_LABEL = { "blueprint-align": "蓝图对齐", "dynamic-optimal": "动态最优(即时收益)" };
  function strategyLabel(key) {
    return STRATEGY_LABEL[key] || key;
  }

  // action.type → { ptag 颜色类, 中文标签 }
  const TYPE_META = {
    repair: { cls: "pr", label: "修复" },
    place: { cls: "pp", label: "放置" },
    lock: { cls: "pl", label: "锁牌" },
    skip: { cls: "ps", label: "低优先" },
  };

  // 默认蓝图模板（state.lastLoadedTemplate 为空时兜底）
  const DEFAULT_BLUEPRINT = "core-shell-cycle";

  function roomLabel(room) {
    if (!room) return "";
    if (room === "path") return "通路";
    const meta = (typeof ROOM_TYPES !== "undefined" && ROOM_TYPES) ? ROOM_TYPES[room] : null;
    return (meta && meta.label) || room;
  }

  // 把 STRATEGIES 的键填进 #loopStrategySelect（数据驱动）。保留已选值。
  function renderStrategyOptions() {
    if (typeof el !== "function") return;
    const sel = el("loopStrategySelect");
    if (!sel) return;
    const strategies = (window.__strategyLayer && window.__strategyLayer.STRATEGIES) || {};
    const keys = Object.keys(strategies);
    if (!keys.length) return;
    const prev = sel.value;
    sel.innerHTML = keys.map(k => `<option value="${escapeAttr(k)}">${escapeAttr(strategyLabel(k))}</option>`).join("");
    // 默认动态最优:任意手牌都能给出具体落点;蓝图对齐对非蓝图手牌会报「无放法」(2026-06-07 bug 2)。
    if (prev && keys.includes(prev)) sel.value = prev;
    else if (keys.includes("dynamic-optimal")) sel.value = "dynamic-optimal";
    bindGenButton();
  }
  window.__loopUI.renderStrategyOptions = renderStrategyOptions;

  // 任务 8b-1:把主要循环蓝图填进 #loopBlueprintSelect。
  // 筛选这三个键(存在才加),让 combat 能直接选目标蓝图,不依赖被隐藏的「载模板」按钮。
  const BLUEPRINT_KEYS = ["core-shell-cycle", "plan-a-b2-hybrid", "core-shell-plan-b"];
  function blueprintLabel(key) {
    const tpl = (typeof GOAL_TEMPLATES !== "undefined" && GOAL_TEMPLATES) ? GOAL_TEMPLATES[key] : null;
    return (tpl && tpl.label) || key;
  }
  function renderBlueprintOptions() {
    if (typeof el !== "function") return;
    const sel = el("loopBlueprintSelect");
    if (!sel) return;
    const tpls = (typeof GOAL_TEMPLATES !== "undefined" && GOAL_TEMPLATES) || {};
    const keys = BLUEPRINT_KEYS.filter(k => tpls[k]);
    if (!keys.length) return;
    // 当前应选中:state.lastLoadedTemplate(若在可选列表里)→ 已有选中值 → 首项
    const want = (state.lastLoadedTemplate && keys.includes(state.lastLoadedTemplate))
      ? state.lastLoadedTemplate
      : (sel.value && keys.includes(sel.value) ? sel.value : keys[0]);
    sel.innerHTML = keys.map(k => `<option value="${escapeAttr(k)}">${escapeAttr(blueprintLabel(k))}</option>`).join("");
    sel.value = want;
    // change → 写入 state.lastLoadedTemplate 并重渲染清单(防重复绑定)
    if (!sel.__loopBpBound && typeof sel.addEventListener === "function") {
      sel.addEventListener("change", () => {
        const v = sel.value;
        if (v) state.lastLoadedTemplate = v;
        renderChecklist();
      });
      sel.__loopBpBound = true;
    }
  }
  window.__loopUI.renderBlueprintOptions = renderBlueprintOptions;

  // 渲染行动清单到 #loopChecklist。
  function renderChecklist() {
    if (typeof el !== "function") return;
    const container = el("loopChecklist");
    if (!container) return;
    bindGenButton();
    renderBlueprintOptions();
    if (typeof window.__loopUI.bindMarkButtons === "function") window.__loopUI.bindMarkButtons();

    const sel = el("loopStrategySelect");
    const strategyKey = (sel && sel.value) || "dynamic-optimal";

    // 蓝图 key：优先下拉选中值 → state.lastLoadedTemplate → core-shell-cycle 兜底。
    const bpSel = el("loopBlueprintSelect");
    const selectedBp = bpSel && bpSel.value;
    const loaded = state.lastLoadedTemplate;
    const blueprintKey = selectedBp || loaded || DEFAULT_BLUEPRINT;

    let data;
    try {
      data = buildActionChecklist(strategyKey, blueprintKey);
    } catch (e) {
      container.innerHTML = `<div class="cl-empty">行动清单生成失败：${escapeAttr(e && e.message || e)}</div>`;
      return;
    }

    let html = "";

    // 未载入蓝图提示(仅蓝图对齐策略相关;动态最优不读蓝图,不显示该提示)
    if (!loaded && strategyKey === "blueprint-align") {
      html += `<div class="cl-note">未载入蓝图，暂用 Plan A；可在<b>战前预演</b>载入目标布局。</div>`;
    }

    const actions = Array.isArray(data.actions) ? data.actions : [];
    if (!actions.length) {
      html += `<div class="cl-empty">神庙已对齐蓝图，无待办。</div>`;
      container.innerHTML = html;
      return;
    }

    html += actions.map(a => {
      const meta = TYPE_META[a.type] || { cls: "ps", label: a.type || "?" };
      const name = roomLabel(a.room);
      const nameHtml = name ? ` <b>${escapeAttr(name)}</b>` : "";
      const posHtml = a.pos ? ` <span class="pos">(${a.pos.row},${a.pos.col})</span>` : "";
      const reasonHtml = a.reason ? `<div class="csub">${escapeAttr(a.reason)}</div>` : "";
      const skipCls = a.type === "skip" ? " skip" : "";
      return `<div class="ci${skipCls}">`
        + `<div class="cbody"><div class="cmain">${meta.label}${nameHtml}${posHtml}</div>${reasonHtml}</div>`
        + `<span class="ptag ${meta.cls}">${escapeAttr(meta.label)}</span>`
        + `</div>`;
    }).join("");

    container.innerHTML = html;
  }
  window.__loopUI.renderChecklist = renderChecklist;

  // ---- 边缘道路连线 overlay（金色 SVG，叠在 9×9 神庙格子上方）----
  // 复用 01-core 的 tileFuseSides(pos)，只画 e/s 边，每段仅跨格子缝隙 ±0.15。
  function renderConnectionOverlay() {
    if (typeof document === "undefined" || !document.createElementNS) return;
    // 注入 .temple-grid（不是 wrap），避开 wrap 的 border/padding；
    // grid 的 offset 布局像素不受 rotate(45deg) 影响，旋转下仍是真实布局尺寸。
    const grid = (typeof document.querySelector === "function") ? document.querySelector(".temple-grid") : null;
    if (!grid) return;

    // 先按 id 删旧 overlay（幂等），避免重复堆叠
    const old = document.getElementById("loop-conn-overlay");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    // mock-dom 防御：grid 无尺寸（offsetWidth/clientWidth 为 0）→ 不画。
    const W = grid.clientWidth || 0, H = grid.clientHeight || 0;
    if (!W || !H) return;

    // 单格边长取任一 .tile 的 offsetWidth；gap 从 computed style（或 --temple-gap）读。
    const firstTile = (typeof grid.querySelector === "function") ? grid.querySelector(".tile") : null;
    const cell = firstTile ? (firstTile.offsetWidth || 0) : 0;
    if (!cell) return;
    let gap = 0;
    if (typeof getComputedStyle === "function") {
      const cs = getComputedStyle(grid);
      gap = parseFloat(cs.gap || cs.gridGap || "");
      if (!(gap >= 0)) gap = parseFloat(cs.getPropertyValue("--temple-gap") || "");
    }
    if (!(gap >= 0)) gap = 0;
    const step = cell + gap;

    const SVG_NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("id", "loop-conn-overlay");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("opacity", "0.9");

    const N = (typeof GRID_SIZE !== "undefined") ? GRID_SIZE : 9;
    const sides = (typeof tileFuseSides === "function") ? tileFuseSides : null;
    if (!sides) { grid.appendChild(svg); return; }

    const sw = Math.max(2, cell * 0.08);
    function line(x1, y1, x2, y2) {
      const ln = document.createElementNS(SVG_NS, "line");
      ln.setAttribute("x1", x1); ln.setAttribute("y1", y1);
      ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
      ln.setAttribute("stroke", "#c89850");
      ln.setAttribute("stroke-width", sw);
      ln.setAttribute("stroke-linecap", "round");
      svg.appendChild(ln);
    }
    // 每格中心像素
    const cx = (c) => c * step + cell / 2;
    const cy = (r) => r * step + cell / 2;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const fs = sides({ row: r, col: c });
        if (!fs) continue;
        // e=true：与右邻连通，横段正好跨 c 与 c+1 间那条 gap
        if (fs.e) line(c * step + cell, cy(r), (c + 1) * step, cy(r));
        // s=true：与下邻连通，纵段正好跨 r 与 r+1 间那条 gap
        if (fs.s) line(cx(c), r * step + cell, cx(c), (r + 1) * step);
      }
    }

    grid.appendChild(svg);
  }
  window.__loopUI.renderConnectionOverlay = renderConnectionOverlay;

  // 「生成行动清单」按钮事件（防重复绑定，渲染可能多次调用）。
  function bindGenButton() {
    if (typeof el !== "function") return;
    const btn = el("loopGenBtn");
    if (!btn || btn.__loopGenBound) return;
    btn.addEventListener("click", () => renderChecklist());
    btn.__loopGenBound = true;
  }
  window.__loopUI.bindGenButton = bindGenButton;

  // ---- 傻瓜塌陷实测器:白话结论面板 ----
  // 把 analyzeProbe 的判定翻成白话(对齐用户给的映射),渲染进 #loopProbePanel,并绑定「重置实测数据」。
  // 只讲塌陷选点(是不是只打最远端)+ 数量 + cut-vertex 行为;不碰纹章掉率。

  function escapeProbe(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // status → 白话主结论(重点回答"是不是只打最远端");低置信由调用处追加复核提醒。
  function probeVerdictText(rec) {
    switch (rec.status) {
      case "PLAN_A":
        return { cls: "good", text: "<b>不是只打最远端</b>(随机/偏远端散布)→ 核心可锁中间安全区 ✓" };
      case "CHAIN_END":
        return { cls: "warning", text: "<b>只打最远端</b> → 核心别放最远,外圈做牺牲房" };
      case "AMBIGUOUS":
        return { cls: "", text: "还分不清,再记几次(尤其远端 d≥6 的塌陷点判别力强)" };
      default:  // PENDING
        return { cls: "", text: "样本太少,继续关庙记录" };
    }
  }

  // cut-vertex 命中时的白话(降级 / 删除)。
  function probeCutVertexText(cv) {
    if (!cv || cv.n === 0) return cv && cv.note ? cv.note : "还没记到断点(cut vertex)塌陷样本";
    const n = cv.n_cut_vertex_hits || 0;
    const dg = Math.round((cv.ratio_downgrade || 0) * n);
    const rm = Math.round((cv.ratio_remove || 0) * n);
    const parts = [];
    if (dg > 0) parts.push(`降级为通路 ${dg}/${n}`);
    if (rm > 0) parts.push(`删除 ${rm}/${n}`);
    return parts.length ? parts.join(" · ") : `${n} 次命中`;
  }

  function renderProbePanel() {
    if (typeof el !== "function") return;
    const root = el("loopProbePanel");
    if (!root) return;
    bindProbeButtons();

    const a = analyzeProbe();
    const rec = a.recommendation || {};
    const v = probeVerdictText(rec);
    // 低置信(样本<20)且已下结论 → 结论后加一句"先参考,再记到 20 次更稳"。
    const lowSuffix = (rec.low_confidence && (rec.status === "PLAN_A" || rec.status === "CHAIN_END"))
      ? "(先参考,再记到 20 次更稳)" : "";
    const avg = a.batches > 0 ? a.avgPerClose.toFixed(1) : "—";

    // 还差 ~K 次关庙结论更稳(样本 < 20)
    let needLine = "";
    if (a.n < PROBE_TARGET_N) {
      const perClose = a.avgPerClose > 0 ? a.avgPerClose : 2;  // 没数据时按经验 ~2 格/次估
      const moreCloses = Math.max(1, Math.ceil((PROBE_TARGET_N - a.n) / perClose));
      needLine = `<p style="color:var(--muted);font-size:11px">还差 ~${moreCloses} 次关庙结论更稳(样本 ${a.n}/${PROBE_TARGET_N})</p>`;
    }

    // 端口分析的概率(只报合并 Plan A vs chain-end;内部 random/weighted 不报,见 py 注释)。
    let probLine = "";
    if (a.n > 0) {
      const pA = (a.posterior.random + a.posterior.weighted);
      const pB = a.posterior["chain-end"];
      probLine = `<p style="font-family:Consolas,monospace;font-size:11px">P(非最远端/Plan A) = ${pA.toFixed(2)} · P(只打最远端/chain-end) = ${pB.toFixed(2)}</p>`;
    }

    root.innerHTML = `
      <div class="item">
        <strong>实测进度</strong>
        <p>已记 <b>${a.batches}</b> 次关庙 · <b>${a.nObservations}</b> 个塌陷点 · 平均每次塌 ~${avg} 格</p>
      </div>
      <div class="item ${v.cls}">
        <strong>塌陷选点</strong>
        <p>${v.text}${escapeProbe(lowSuffix)}</p>
        ${probLine}
        ${needLine}
      </div>
      <div class="item">
        <strong>断点(cut vertex)命中时</strong>
        <p style="font-size:12px">${probeCutVertexText(a.cutVertex)}</p>
      </div>
      <button id="loopProbeReset" style="margin-top:6px">重置实测数据</button>`;

    // innerHTML 重写会丢掉旧按钮的监听 → 每次渲染后重绑(用 onclick,幂等不堆叠)。
    const btn = el("loopProbeReset");
    if (btn) btn.onclick = () => {
      resetProbeLog();
      renderProbePanel();
    };
  }
  window.__loopUI.renderProbePanel = renderProbePanel;

  // 「重置实测数据」按钮在 renderProbePanel 内用 onclick 重绑;此处占位以便 renderChecklist 早期调用不报错。
  function bindProbeButtons() { /* no-op:实际绑定在 renderProbePanel 末尾(onclick 幂等) */ }

  // ---- 任务 8b-2:关庙后塌陷标记模式 ----
  // 流程:点「关庙后·标记塌陷」进入标记模式 → 点格子在 无→塌陷→降级→无 间循环(只改 DOM 高亮)
  //       → 点「✓ 确认更新」一次性 applyCollapseMarks 落库 + 持久化 + 全量重渲染。

  // 全量重渲染(map + metrics + 清单 + 道具 + 实测面板)。优先 analyzeAndRender(其内部已渲染实测面板),
  // 回退 renderMap 时手动补渲实测面板。
  function rerenderAll() {
    if (typeof analyzeAndRender === "function") { analyzeAndRender(); return; }
    if (typeof renderMap === "function") renderMap();
    try { renderProbePanel(); } catch (e) { /* 实测面板渲染失败不阻断主渲染 */ }
  }

  // 取某 pos 对应的格子 DOM(浏览器有 querySelector;mock dom 无 → 返回 null)。
  function tileNodeAt(pos) {
    if (typeof document === "undefined" || typeof document.querySelector !== "function") return null;
    return document.querySelector(`.tile[data-row="${pos.row}"][data-col="${pos.col}"]`);
  }

  // 给格子 DOM 加/去某 class(防御:node 或 classList 缺失时静默)。
  function setNodeMarkClass(node, collapsed, downgraded) {
    if (!node || !node.classList) return;
    node.classList.remove("mark-collapsed");
    node.classList.remove("mark-downgraded");
    if (collapsed) node.classList.add("mark-collapsed");
    else if (downgraded) node.classList.add("mark-downgraded");
  }

  // 点格子:在 collapseMarks 里把该 pos 状态循环 无→collapsed→downgraded→无,并同步 DOM。
  function cycleMark(pos) {
    if (!pos || pos.row == null || pos.col == null) return;
    const idx = collapseMarks.findIndex(m => m.row === pos.row && m.col === pos.col);
    if (idx < 0) {
      collapseMarks.push({ row: pos.row, col: pos.col, kind: "collapsed" });
      setNodeMarkClass(tileNodeAt(pos), true, false);
    } else if (collapseMarks[idx].kind === "collapsed") {
      collapseMarks[idx].kind = "downgraded";
      setNodeMarkClass(tileNodeAt(pos), false, true);
    } else {
      collapseMarks.splice(idx, 1);
      setNodeMarkClass(tileNodeAt(pos), false, false);
    }
  }
  window.__loopUI.cycleMark = cycleMark;

  // 切换标记模式:翻转 markMode,改按钮文案 / 确认键显隐 / body.mark-mode,重渲染 map。
  function toggleMarkMode() {
    window.__loopUI.markMode = !window.__loopUI.markMode;
    const on = window.__loopUI.markMode;
    if (typeof el === "function") {
      const toggleBtn = el("loopMarkToggle");
      if (toggleBtn) toggleBtn.textContent = on ? "✕ 退出标记" : "关庙后·标记塌陷";
      const confirmBtn = el("loopMarkConfirm");
      if (confirmBtn && confirmBtn.style) confirmBtn.style.display = on ? "" : "none";
    }
    if (typeof document !== "undefined" && document.body && document.body.classList) {
      if (on) document.body.classList.add("mark-mode");
      else document.body.classList.remove("mark-mode");
    }
    // 退出标记模式时丢弃未确认的标记(下次进入重新标)。
    if (!on) collapseMarks = [];
    rerenderAll();
  }
  window.__loopUI.toggleMarkMode = toggleMarkMode;

  // 「✓ 确认更新」:落库塌陷标记 + 持久化 + 退出标记模式 + 全量重渲染。
  function bindMarkButtons() {
    if (typeof el !== "function") return;
    const toggleBtn = el("loopMarkToggle");
    if (toggleBtn && !toggleBtn.__loopMarkBound && typeof toggleBtn.addEventListener === "function") {
      toggleBtn.addEventListener("click", () => toggleMarkMode());
      toggleBtn.__loopMarkBound = true;
    }
    const confirmBtn = el("loopMarkConfirm");
    if (confirmBtn && !confirmBtn.__loopMarkBound && typeof confirmBtn.addEventListener === "function") {
      confirmBtn.addEventListener("click", () => {
        // 先按确认前(塌陷前)拓扑采集观测,再 applyCollapseMarks 改 tiles —— 顺序不可换。
        captureProbeBatch(collapseMarks);
        applyCollapseMarks(collapseMarks);
        if (typeof window !== "undefined" && window.localStorage) {
          try { saveLoopState(window.localStorage); } catch (e) { /* 持久化失败不阻断 UI */ }
        }
        collapseMarks = [];
        window.__loopUI.markMode = false;
        if (confirmBtn.style) confirmBtn.style.display = "none";
        if (toggleBtn) toggleBtn.textContent = "关庙后·标记塌陷";
        if (typeof document !== "undefined" && document.body && document.body.classList) {
          document.body.classList.remove("mark-mode");
        }
        rerenderAll();
      });
      confirmBtn.__loopMarkBound = true;
    }
  }
  window.__loopUI.bindMarkButtons = bindMarkButtons;
})();
