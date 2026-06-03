    var TEMPLE_DATA = window.TEMPLE_DATA;
    if (!TEMPLE_DATA) throw new Error("TEMPLE_DATA not loaded");

    var CATEGORY_TO_KIND = { craft: "craft", reward: "reward", power: "power", utility: "utility", boss: "boss", path: "path", special: "utility" };
    var VALUE_CLASS_TO_NUMBER = { "very-low": 0, "low": 4, "mid": 8, "high": 12, "very-high": 16 };

    var ROOM_TYPES = Object.fromEntries(TEMPLE_DATA.rooms.map(r => [r.id, {
      label: r.name_zh,
      kind: CATEGORY_TO_KIND[r.category] ?? "utility",
      value: VALUE_CLASS_TO_NUMBER[r.valueClass] ?? 0,
      maxTier: r.maxTier,
      tierChain: r.tierChain ?? null,
      needsPower: !!r.needsPower,
      powerCount: r.powerCount ?? 0,
      powerRangeByTier: r.powerRangeByTier ?? null,
      amplifies: r.amplifies ?? null,
      amplifyRangeByTier: r.amplifyRangeByTier ?? null,
      amplifyMultByTier: r.amplifyMultByTier ?? null,
      upgradeAdjacency: r.upgradeAdjacency ?? null,
      powerTier: r.powerTier ?? null,
      transformsFrom: r.transformsFrom ?? null,
      notConnectableTo: r.notConnectableTo ?? null,
      notConnectableInChainWith: r.notConnectableInChainWith ?? null,
      modBonus: r.modBonus ?? null,
      t3Special: r.t3Special ?? null,
      // GGPK 一手解码的 per-tier 纹章掉源子集(Incursion2RoomPerLevel.Description2),
      // 仅 9 个掉源房有此字段(spymaster/commander/smithy/legion_barrack/flesh_surgeon/
      // alchemy_lab/thaumaturge/golem_works/sacrificial_chamber),其余房为 null。
      medallionDrops: r.medallionDrops ?? null,
      valueClass: r.valueClass ?? "very-low",
      oneShot: !!r.oneShot,
      fixedSlot: !!r.fixedSlot,
      destabiliseEligible: r.destabiliseEligible !== false,
      category: r.category
    }]));

    // poe2wiki 9 种纹章全实装(round v.5,2026-05-19 修复"3 种永远掉不出来"bug)。
    // 之前 MEDALLION_TYPES 含 7 种但 DROP_WEIGHTS 只有 4 种 → estazunti/hayoxi/uromoti 永远掉不出。
    // 现在 9 种全部加进 drop pool,Azcapa/Xopec 用极低权重(meta 容量升级,偶尔掉到)。
    var MEDALLION_TYPES = ["juatalotli", "quipolatl", "zantipi", "puhuarte", "estazunti", "hayoxi", "uromoti", "azcapa", "xopec"];
    var MEDALLION_LABEL = {
      juatalotli: "锁定纹章",
      quipolatl: "升阶纹章",
      zantipi: "加词条纹章",
      puhuarte: "重抽手牌纹章",
      estazunti: "加奖励槽纹章",
      hayoxi: "重抽奖励纹章",
      uromoti: "加房纹章",
      azcapa: "纹章上限纹章",
      xopec: "水晶上限纹章"
    };
    var MEDALLION_SHORT = {
      juatalotli: "锁",
      quipolatl: "升",
      zantipi: "词",
      puhuarte: "抽",
      estazunti: "槽",
      hayoxi: "翻",
      uromoti: "加",
      azcapa: "容",
      xopec: "晶"
    };

    var ROOM_ICON_PATHS = {
      garrison: "assets/rooms/garrison.png",
      spymaster: "assets/rooms/spymaster.png",
      smithy: "assets/rooms/smithy.png",
      armoury: "assets/rooms/armoury.png",
      commander: "assets/rooms/commander.png",
      synthflesh_lab: "assets/rooms/synthflesh_lab.png",
      flesh_surgeon: "assets/rooms/flesh_surgeon.png",
      alchemy_lab: "assets/rooms/alchemy_lab.png",
      thaumaturge: "assets/rooms/thaumaturge.png",
      golem_works: "assets/rooms/golem_works.png",
      corruption_chamber: "assets/rooms/corruption_chamber.png",
      vault: "assets/rooms/vault.png",
      currency_vault: "assets/rooms/vault.png",
      gem_vault: "assets/rooms/vault.png",
      augment_vault: "assets/rooms/vault.png",
      sealed_vault: "assets/rooms/vault.png",
      kishara_vault: "assets/rooms/kishara_vault.png",
      unique_vault: "assets/rooms/unique_vault.png",
      jiquani_vault: "assets/rooms/jiquani_vault.png",
      tablet_vault: "assets/rooms/tablet_vault.png",
      ancient_reliquary_vault: "assets/rooms/ancient_reliquary_vault.png",
      royal_access_chamber: "assets/rooms/royal_access_chamber.png",
      extraction_chamber: "assets/rooms/extraction_chamber.png",
      atziri_chamber: "assets/rooms/atziri_chamber.png",
      sacrificial_chamber: "assets/rooms/sacrificial_chamber.png",
      architect_chamber: "assets/rooms/architect_chamber.png",
      transcendent_barracks: "assets/rooms/garrison.png"
    };
    var MEDALLION_ICON_PATHS = {
      juatalotli: "assets/medallions/juatalotli.png",
      quipolatl: "assets/medallions/quipolatl.png",
      zantipi: "assets/medallions/zantipi.png",
      puhuarte: "assets/medallions/puhuarte.png"
    };
    var ROOM_GLYPHS = {
      entrance: "⚲",
      path: "",
      garrison: "▼",
      commander: "★",
      armoury: "◆",
      smithy: "⚒",
      generator: "☀",
      spymaster: "◉",
      synthflesh_lab: "❀",
      flesh_surgeon: "⚕",
      transcendent_barracks: "⛨",
      alchemy_lab: "☼",
      thaumaturge: "✷",
      golem_works: "▲",
      corruption_chamber: "✪",
      vault: "♦",
      sacrificial_chamber: "✟",
      ancient_reliquary_vault: "✦",
      kishara_vault: "✦",
      jiquani_vault: "✦",
      currency_vault: "♦",
      gem_vault: "◈",
      augment_vault: "✧",
      tablet_vault: "▣",
      unique_vault: "✶",
      sealed_vault: "❖",
      extraction_chamber: "⊛",
      architect_chamber: "⚜",
      royal_access_chamber: "⊕",
      atziri_chamber: "☉"
    };
    // 仅历史/非掉落用:2026-06-03 起 collectMedallions 改用 GGPK 各房 medallionDrops 子集均匀抽,
    // 不再走这套扁平全局池。MEDALLION_DROP_WEIGHTS + rollMedallionType 不再参与任何实际掉落,
    // 仅保留供 atziri-temple-sim.test.mjs 的历史 rollMedallionType 回归断言引用(见 Test 119-121)。
    // azcapa/xopec 是 0.5 已废的 meta 容量纹章,真实游戏不掉(GGPK 掉源表无它们)。
    var MEDALLION_DROP_WEIGHTS = {
      juatalotli: 0.35,  // 锁牌(最常用)
      quipolatl: 0.20,   // 升阶
      zantipi: 0.10,     // 加词条
      puhuarte: 0.08,    // 重抽手牌
      estazunti: 0.08,   // 加奖励槽
      hayoxi: 0.07,      // 重抽奖励
      uromoti: 0.07,     // 加房
      azcapa: 0.025,     // 纹章上限(罕见)
      xopec: 0.025       // 水晶上限(罕见)
    };
    var HAND_SIZE = 6;
    var MODS_PER_ZANTIPI = 0.10;

    // 旧的 kind-based 策略倍率 — 保留给历史代码引用,但新评分用 STAT_WEIGHTS。
    var STRATEGY_MULT = {
      balanced: { craft: 1.12, reward: 1, boss: 1.02, utility: .9, power: .85, path: 0 },
      craft: { craft: 1.45, reward: .85, boss: .85, utility: .95, power: 1, path: 0 },
      boss: { craft: .9, reward: .8, boss: 1.55, utility: .8, power: .75, path: 0 },
      scarab: { craft: .92, reward: 1.35, boss: .95, utility: .95, power: .85, path: 0 }
    };

    // 策略对 mod stat 的偏好权重 — 不在表里的 stat 权重 = 1
    var STAT_WEIGHTS = {
      balanced: {},
      craft: {
        chest_item_rarity: 1.35, item_rarity: 1.35, gold: 1.10, rare_chests: 1.10,
        rare_extra_mod_chance: 1.20,
        experience: 0.85, pack_size: 0.95,
        humanoid_effectiveness: 0.90, construct_effectiveness: 0.90,
        rare_effectiveness: 0.95, unique_effectiveness: 0.95,
        magic_monster_count: 0.95, normal_monster_effectiveness: 0.90
      },
      boss: {
        rare_effectiveness: 1.50, unique_effectiveness: 1.50,
        construct_effectiveness: 1.40, humanoid_effectiveness: 1.30,
        rare_extra_mod_chance: 1.30,
        chest_item_rarity: 0.85, item_rarity: 0.85, rare_chests: 0.90,
        gold: 0.80, experience: 0.80,
        pack_size: 1.05, magic_monster_count: 1.10, normal_monster_effectiveness: 1.10
      },
      scarab: {
        rare_chests: 1.50, gold: 1.35, item_rarity: 1.25, chest_item_rarity: 1.10,
        pack_size: 1.20, magic_monster_count: 1.20,
        rare_extra_mod_chance: 1.10,
        rare_effectiveness: 0.95, unique_effectiveness: 0.95,
        construct_effectiveness: 0.85, humanoid_effectiveness: 0.85,
        experience: 0.90, normal_monster_effectiveness: 1.0
      }
    };
    function statWeight(strategy, stat) {
      const w = STAT_WEIGHTS[strategy];
      if (!w) return 1;
      return w[stat] ?? 1;
    }

    // reward vault 的 valueClass → 一次性掉落基准值(用于跟主乘式相加,不进 stack)
    var VAULT_VALUE_CLASS = {
      "very-low": 0, low: 5, mid: 12, high: 25, "very-high": 50
    };

    // ===== Atlas 全点加成(atlasFullClear,见 data/rooms.json)=====
    // 神庙 Atlas Incursion 子树 36 点稳态全点假设。系数真值来自 AtlasIncursionNodes.json 一手解包。
    // temple_bonus 系列(Power Relays / Efficient Arteries / Xipocado)语义推断 = 房间 modBonus 贡献缩放,
    // 乘到每房 modBonus 贡献(在 ampMult×modsMult×statWeight×decay 之外)。⚠ 语义待游戏实测确认。
    var ATLAS_FULL_CLEAR = TEMPLE_DATA.atlasFullClear ?? null;
    var ATLAS_TEMPLE_BONUS = ATLAS_FULL_CLEAR?.applied?.templeBonusScaling ?? {};
    // Power Relays: 所有产出房 ×1.2(无条件)
    var ATLAS_POWER_RELAYS_MULT = ATLAS_TEMPLE_BONUS.powerRelays?.mult ?? 1.2;
    // Efficient Arteries: 邻接 room 数 ≥ threshold 时额外 ×1.2
    var ATLAS_EFFICIENT_ARTERIES_MULT = ATLAS_TEMPLE_BONUS.efficientArteries?.mult ?? 1.2;
    var ATLAS_EFFICIENT_ARTERIES_THRESHOLD = ATLAS_TEMPLE_BONUS.efficientArteries?.adjacentRoomsThreshold ?? 4;
    // Xipocado's Machinations: 每种 content 房型的第 1 个房额外 ×2.5(+150%)
    var ATLAS_XIPOCADO_MULT = ATLAS_TEMPLE_BONUS.xipocadoMachinations?.mult ?? 2.5;
    // Royal Prerogative: reward 房被塌陷选中时,15% 几率免疫
    var ATLAS_ROYAL_PREROGATIVE_CHANCE = (ATLAS_FULL_CLEAR?.applied?.royalPrerogative?.value ?? 0) / 100;

    // 邻接 room 数(Efficient Arteries 判定):上下左右 4 邻中 content 非 empty / 非 path / 未 destroyed。
    // ⚠ 本地推断:path 不计为 room。语义待实测确认(atlasFullClear.efficientArteries.adjacentRoomDef)。
    function adjacentRoomCount(pos) {
      let n = 0;
      for (const nb of adjacentInBounds(pos)) {
        const t = tileAt(nb);
        if (!t || t.destroyed) continue;
        if (t.content === "empty" || t.content === "path") continue;
        n++;
      }
      return n;
    }

    // 单房 Atlas modBonus 缩放系数。isFirstOfType:该房是否为其 content 组排序后的第 1 个(Xipocado)。
    // ⚠ 三节点(Power Relays / Efficient Arteries / Xipocado)tooltip 同为 "increased effect of Incursion
    // Temple Room bonuses",按 PoE「同类 increased 相加」惯例 + IDA loot 公式 (1+totalBonus%/100) 结构,
    // 三者按百分比【求和】后一次性 (1+Σ%),而非各自 (1+x) 相乘。各节点 +% = (对应 MULT - 1)。
    // 例:每型第1房 = 1+(0.2+1.5)=2.7;第1房且满4邻 = 1+(0.2+0.2+1.5)=2.9;纯 Power Relays = 1.2。
    function atlasModMult(pos, isFirstOfType) {
      let pct = ATLAS_POWER_RELAYS_MULT - 1;              // +20% 无条件(所有产出房)
      if (adjacentRoomCount(pos) >= ATLAS_EFFICIENT_ARTERIES_THRESHOLD) pct += ATLAS_EFFICIENT_ARTERIES_MULT - 1;  // +20% 满4邻
      if (isFirstOfType) pct += ATLAS_XIPOCADO_MULT - 1;  // +150% 每型第1房
      return 1 + pct;
    }

    // Royal Prerogative (Atlas 全点):reward 房被塌陷选中时,15% 几率免疫。
    // ⚠ 仅对 category=reward 的房消耗 rng(独立 roll,与选点算法解耦) — 非 reward 布局不动 rng 序列,
    // 保 JS↔Python parity(两端同一 rng 序列、同一 roll 时机:确定要应用到 reward tile 之前)。
    // 返回 true = 该房免疫本次塌陷(pick 跳过,塌陷次数照常消耗,房存活)。
    function rollRewardPrerogativeImmune(pos) {
      if (ATLAS_ROYAL_PREROGATIVE_CHANCE <= 0) return false;
      const tile = tileAt(pos);
      if (!tile) return false;
      const meta = ROOM_TYPES[tile.content];
      if (!meta || meta.category !== "reward") return false;
      return rnd() < ATLAS_ROYAL_PREROGATIVE_CHANCE;
    }

    // 期望掉落乘式的基准点 — 空神庙 score = 0,每加 100% mod 给 +100 score 点
    var BASE_LOOT = 100;

    var GRID_SIZE = 9;
    // (col=4, row=8) 旋转 45° 后在屏幕 SW 方向 — 当前 UI 坐标系与游戏内方位一致
    var FOYER_TILE = { row: 8, col: 4 };
    var ATZIRI_TILE = { row: 0, col: 4 };
    var BOARD_LAYOUT = {
      cell: 48,
      gap: 5,
      border: 12,
      anchorGap: 12,
      atziriSize: 57
    };
    var ROMAN_TIER = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];
    // round v.6 (2026-05-19,task #48 修复):重命名 ROYAL_ACCESS_CANDIDATES → OUTER_EDGE_REWARD_SLOTS
    // 之前变量名误导,暗示"专给开 boss 门钥匙房用的格子",实际是**所有奖励房**(含钥匙房 + 各种宝藏房)的外缘候选格。
    // 数据层:rooms.json 之前 royal_access_chamber 同 id 双定义(line 786 详细版 + line 1014 旧版),
    // Object.fromEntries 后面覆盖前面 → 实际生效旧版,详细 wiki notes 被忽略。已删旧版,保留新版。
    // Cyclic Temple 策略下:钥匙房卡来了就**扔掉**,不放外缘 → 不会触发 boss 入口,神庙循环刷不被大塌陷。
    var OUTER_EDGE_REWARD_SLOTS = [
      { row: 0, col: 2 }, { row: 0, col: 6 },
      { row: 2, col: 0 }, { row: 2, col: 8 },
      { row: 6, col: 0 }, { row: 6, col: 8 },
      { row: 8, col: 2 }, { row: 8, col: 6 }
    ];
    // 保留旧名作 alias 不破坏其他引用
    var ROYAL_ACCESS_CANDIDATES = OUTER_EDGE_REWARD_SLOTS;

    var MAP = { width: 1180, height: 920, centerX: 590, stepX: 56, stepY: 36, originY: 100 };

    // 0.5 PN(2026-05-18 收到)未提及修改击杀塌陷房数,沿用 0.4 数字。
    // 0.5 PN 唯一塌陷规则改动:断链关键房从"跳过"改"降级为通路",已在 applyDestabiliseBatch 实现。
    var EVENT_PERCENT = {
      "0.4": { enter: { abs: 2 }, architect: { pct: 0.30 }, atziri: { pct: 0.50 }, close: { pct: 0.10 } },
      "0.5": { enter: { abs: 2 }, architect: { pct: 0.30 }, atziri: { pct: 0.50 }, close: { pct: 0.10 } }
    };

    // PLACEHOLDER-05: 纹章掉源房每 visit 每 tier 出纹章的概率(T1-T4)。
    // ⚠ 掉率本质说不准(随机 + 服务端 + 样本永远难够)——【非建模/实测目标,不校准】(2026-06-03 用户定:
    //   掉率说不准的不应加入建模,有就用没有就不用)。此占位【仅为让 MC 跑通,非可信结论、不当决策依据】。
    // 区分:掉【源】(哪房哪 tier 掉哪个子集)= GGPK Description2 确定、已落地(各房 medallionDrops)→ 用;
    //   掉【率%】= 测不准 → 不强求。原 SPYMASTER_MEDALLION_RATE = [0.15,0.30,0.60]。
    var MEDALLION_DROP_RATE_BY_TIER = [0.15, 0.30, 0.60, 0.60];

    // 连接规则基于 GGPK Incursion2Rooms 的 UpgradedBy / ConvertedBy / ConvertedTo,
    // 再加本地连接图补充项;不再引用第三方前端源码作机制来源。
    // Path 与任何房可连(在 canConnect 已处理),Royal Architect 例外。
    // 同链 / 同升级 / 同转换 / 显式互动关系的房邻接 = 直接连通,不需要 path。
    var ADJACENCY_RULES = {
      garrison: ["commander", "armoury", "spymaster", "synthflesh_lab", "transcendent_barracks", "legion_barrack", "flesh_surgeon"],  // flesh_surgeon: 图中显式
      transcendent_barracks: ["commander", "armoury", "synthflesh_lab", "garrison"],
      commander: ["garrison", "transcendent_barracks"],
      armoury: ["garrison", "transcendent_barracks", "smithy", "alchemy_lab", "spymaster", "legion_barrack", "synthflesh_lab"],  // synthflesh: 图中显式
      smithy: ["armoury", "golem_works"],
      golem_works: ["smithy"],
      generator: ["thaumaturge", "sacrificial_chamber"],
      spymaster: ["garrison", "armoury", "legion_barrack"],
      legion_barrack: ["armoury", "spymaster", "garrison"],  // wiki 849: 可连 Spymaster + Armoury(升级源);850:不可连 Commander(由 notConnectableTo 处理)
      synthflesh_lab: ["garrison", "transcendent_barracks", "flesh_surgeon", "armoury"],  // armoury: 图中显式
      flesh_surgeon: ["synthflesh_lab", "garrison"],  // garrison: 图中显式
      alchemy_lab: ["armoury", "thaumaturge", "sacrificial_chamber"],  // wiki 597
      thaumaturge: ["alchemy_lab", "sacrificial_chamber", "corruption_chamber", "generator"],
      corruption_chamber: ["thaumaturge", "sacrificial_chamber"],
      sacrificial_chamber: ["thaumaturge", "corruption_chamber", "generator", "alchemy_lab"]  // wiki 597
    };

    // 红箭头-星号布局禁忌(图脚注):带 * 的房不能被红箭头连接的房四面包围。
    //   alchemy_lab 不能被 armoury 四面包围(红箭头:armoury ↔ alchemy_lab)
    //   thaumaturge 不能被 corruption_chamber 四面包围(红箭头:thaumaturge ↔ corruption_chamber)
    // 当前未实装这一约束,后续若 planner 推荐违法布局再加。
    var RED_ARROW_SURROUND_FORBIDDEN = {
      alchemy_lab: ["armoury"],
      thaumaturge: ["corruption_chamber"]
    };

    // chain 染色 12 色循环(UI 视觉分组,非机制来源)
    var CHAIN_COLORS = 12;

    var state = {
      tiles: [],
      architectPos: null,
      royalAccessPos: null,
      selected: null,
      medallionPool: { juatalotli: 0, quipolatl: 0, zantipi: 0, puhuarte: 0, estazunti: 0, hayoxi: 0, uromoti: 0, azcapa: 0, xopec: 0 },
      hand: [],
      handInventory: {},   // 循环助手：进庙前报库存 {roomId: count}，复用 medallionPool 作纹章库存
      chain: [],
      chainStrict: false,
      destabiliseLog: [],
      pendingAssassinateUpgrade: null,
      // 本次访问累积的塌陷标记数(wiki 291:enter/encounter 完成 marks,close 才 resolve)
      pendingExitDestabilise: 0,
      // 阿兹里击杀后排队的 Royal Access 摧毁,关庙时执行
      pendingRoyalAccessDestruction: false,
      // 建筑师击杀后排队的腔室重生,关庙时执行
      pendingArchitectRespawn: false,
      waystoneModCount: 0,
      // 0.5 PN:T4 升级需要 Temple Atlas Tree 上解锁后开启。
      // Atlas 全点假设(atlasFullClear):Transcendent Progress (8027) 已点 → 默认 true。
      t4Unlocked: true,
      snakeComparison: null,
      snakeComparisonMC: null,
      strategyCompareResult: null,
      longRunMCResult: null,
      goalRecommendation: null,
      goalProjection: null,
      templateComparison: null,
      pythonImportResult: null,
      currentLayoutSim: null,  // #105 战前预演"模拟当前布局" 结果
      calibrationSummary: null,
      calibrationRows: []
    };

    var el = id => document.getElementById(id);

    // round v.3 (2026-05-19): 可注入 PRNG。
    // 所有非确定性逻辑(塌陷选择、纹章掉率、手牌抽取、建筑师位置等)统一用 _rng() 代替 rnd()。
    // 默认 _rng = Math.random; 测试 / MC 模拟可用 setRng(makeSeededRng(seed)) 固定 seed。
    var _rng = Math.random;
    function setRng(fn) { _rng = fn; }
    function getRng() { return _rng; }
    function rnd() { return _rng(); }
    // mulberry32 seedable PRNG (good distribution, fast, deterministic)
    function makeSeededRng(seed) {
      let s = (seed | 0) >>> 0;
      return function() {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function tilesInit() {
      state.tiles = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        state.tiles[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          state.tiles[r][c] = { content: "empty", tier: 0, manualWeight: 0, medallion: null, mods: 0, destroyed: false, rewardLocked: false, assassinateUpgraded: false };
        }
      }
    }

    function tileAt(pos) {
      if (!pos || pos.row < 0 || pos.row >= GRID_SIZE || pos.col < 0 || pos.col >= GRID_SIZE) return null;
      return state.tiles[pos.row][pos.col];
    }

    function tileContent(pos) {
      const t = tileAt(pos);
      if (!t || t.destroyed) return "empty";
      return t.content;
    }

    function tileKey(pos) { return `${pos.row},${pos.col}`; }
    function parseKey(key) {
      if (!key || typeof key !== "string") return null;
      const m = key.match(/^(\d+),(\d+)$/);
      if (!m) return null;
      return { row: Number(m[1]), col: Number(m[2]) };
    }

    function gridAdjacent(a, b) {
      return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
    }

    function adjacentInBounds(pos) {
      const out = [];
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const r = pos.row + dr, c = pos.col + dc;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) out.push({ row: r, col: c });
      }
      return out;
    }

    function isRoyalArchitectTile(pos) {
      return tileContent(pos) === "architect_chamber";
    }

    function canConnect(a, b) {
      const ca = tileContent(a);
      const cb = tileContent(b);
      if (ca === "empty" || cb === "empty") return false;
      // poe2wiki 限制:某些房有 notConnectableTo 黑名单(例如 Legion Barracks 不可连 Commander)
      const metaA = ROOM_TYPES[ca];
      const metaB = ROOM_TYPES[cb];
      if (metaA?.notConnectableTo?.includes(cb)) return false;
      if (metaB?.notConnectableTo?.includes(ca)) return false;
      if (ca === "path" || cb === "path") return true;
      // 特殊房:连接任何邻接房
      //   Architect's Chamber(wiki line 1184,0.4.0c 改动)
      //   Atziri's Chambers (wiki line 1171,0.4.0d 改动)
      if (isRoyalArchitectTile(a) || isRoyalArchitectTile(b)) return true;
      if (ca === "atziri_chamber" || cb === "atziri_chamber") return true;
      // 两个 named room — 查 ADJACENCY_RULES
      if (ADJACENCY_RULES[ca]?.includes(cb)) return true;
      if (ADJACENCY_RULES[cb]?.includes(ca)) return true;
      return false;
    }

    // 链限制(poe2wiki 382/788):某些房间不能放在已含特定房的"linear chain"(snake)里。
    // 简化解读:若拟放置位置经路径连通到任何禁忌房,则拒绝。
    // 返回 { ok, reason } 形式,供 UI / 测试 / 推荐算法判断。
    function canPlaceRoom(pos, content) {
      const meta = ROOM_TYPES[content];
      if (!meta) return { ok: false, reason: "未知房型" };
      if (meta.notConnectableInChainWith?.length) {
        // 临时把 pos 当做该 room,看它的连通分量包含什么
        const tile = tileAt(pos);
        const savedContent = tile.content;
        const savedTier = tile.tier;
        const savedDestroyed = tile.destroyed;
        tile.content = content;
        tile.tier = 1;
        tile.destroyed = false;
        const reachableFromPos = bfsConnectedFrom(pos);
        // 还原
        tile.content = savedContent;
        tile.tier = savedTier;
        tile.destroyed = savedDestroyed;
        for (const k of reachableFromPos) {
          if (k === tileKey(pos)) continue;
          const t = tileAt(parseKey(k));
          if (!t) continue;
          if (meta.notConnectableInChainWith.includes(t.content)) {
            return { ok: false, reason: `${meta.label} 不能与同链中的 ${ROOM_TYPES[t.content]?.label ?? t.content} 共存` };
          }
        }
      }
      return { ok: true };
    }

    // 从 pos 出发 BFS 经 canConnect 走到的所有格子(不含 pos 自己,但 reachableFromFoyer 包含起点)
    function bfsConnectedFrom(start) {
      const visited = new Set([tileKey(start)]);
      const queue = [start];
      while (queue.length) {
        const cur = queue.shift();
        for (const nb of adjacentInBounds(cur)) {
          const key = tileKey(nb);
          if (visited.has(key)) continue;
          if (canConnect(cur, nb)) {
            visited.add(key);
            queue.push(nb);
          }
        }
      }
      return visited;
    }

    function pathConnections(pos) {
      const conn = { n: false, s: false, e: false, w: false };
      const dirs = [
        { d: "n", r: pos.row - 1, c: pos.col },
        { d: "s", r: pos.row + 1, c: pos.col },
        { d: "e", r: pos.row, c: pos.col + 1 },
        { d: "w", r: pos.row, c: pos.col - 1 }
      ];
      for (const { d, r, c } of dirs) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
        if (canConnect(pos, { row: r, col: c })) conn[d] = true;
      }
      return conn;
    }

    function computeColorMap() {
      // 把 grid 上所有 connected component 标 12 色循环
      const colorMap = new Map();
      const visited = new Set();
      let nextColor = 0;
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const key = tileKey(pos);
        if (visited.has(key)) continue;
        const tile = tileAt(pos);
        if (tile.destroyed || tile.content === "empty") continue;
        const queue = [pos];
        const component = [];
        while (queue.length) {
          const p = queue.shift();
          const pk = tileKey(p);
          if (visited.has(pk)) continue;
          visited.add(pk);
          component.push(pk);
          for (const next of adjacentInBounds(p)) {
            const nk = tileKey(next);
            if (visited.has(nk)) continue;
            const nt = tileAt(next);
            if (!nt.destroyed && nt.content !== "empty" && canConnect(p, next)) {
              queue.push(next);
            }
          }
        }
        const color = nextColor % CHAIN_COLORS;
        for (const k of component) colorMap.set(k, color);
        nextColor++;
      }
      return colorMap;
    }

    function tileFuseSides(pos) {
      // 哪些 side 应去边框(邻居非 empty / 非 destroyed)
      const sides = { n: false, s: false, e: false, w: false };
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty") return sides;
      const dirs = [
        { d: "n", r: pos.row - 1, c: pos.col },
        { d: "s", r: pos.row + 1, c: pos.col },
        { d: "e", r: pos.row, c: pos.col + 1 },
        { d: "w", r: pos.row, c: pos.col - 1 }
      ];
      for (const { d, r, c } of dirs) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
        const nt = tileAt({ row: r, col: c });
        if (!nt || nt.destroyed) continue;
        if (nt.content === "empty") continue;
        sides[d] = true;
      }
      return sides;
    }

    function reachableFromFoyer() {
      const seen = new Set();
      if (tileContent(FOYER_TILE) === "empty") return seen;
      seen.add(tileKey(FOYER_TILE));
      const queue = [FOYER_TILE];
      while (queue.length) {
        const pos = queue.shift();
        for (const next of adjacentInBounds(pos)) {
          const key = tileKey(next);
          if (seen.has(key)) continue;
          if (canConnect(pos, next)) {
            seen.add(key);
            queue.push(next);
          }
        }
      }
      return seen;
    }

    function atziriReachable() {
      const r = reachableFromFoyer();
      return r.has(tileKey(ATZIRI_TILE)) && tileContent(ATZIRI_TILE) !== "empty";
    }

    function tileChainDistance() {
      const dist = new Map();
      if (tileContent(FOYER_TILE) === "empty") return dist;
      const start = FOYER_TILE;
      dist.set(tileKey(start), 0);
      const queue = [start];
      while (queue.length) {
        const pos = queue.shift();
        const d = dist.get(tileKey(pos));
        for (const next of adjacentInBounds(pos)) {
          const key = tileKey(next);
          if (dist.has(key)) continue;
          if (canConnect(pos, next)) {
            dist.set(key, d + 1);
            queue.push(next);
          }
        }
      }
      return dist;
    }

    function buildChain() {
      state.chainStrict = false;
      const reachable = reachableFromFoyer();
      if (reachable.size === 0) return [];
      if (reachable.size === 1) { state.chainStrict = true; return [tileKey(FOYER_TILE)]; }
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
      const foyerKey = tileKey(FOYER_TILE);
      if (deg.get(foyerKey) === 1) {
        let endpoint = null;
        let strict = true;
        for (const [key, d] of deg) {
          if (key === foyerKey) continue;
          if (d === 1) {
            if (endpoint) { strict = false; break; }
            endpoint = key;
          } else if (d !== 2) { strict = false; break; }
        }
        if (strict && endpoint) {
          const chain = [foyerKey];
          const seen = new Set([foyerKey]);
          let curr = FOYER_TILE;
          while (tileKey(curr) !== endpoint && strict) {
            const nexts = adjacentInBounds(curr).filter(p => reachable.has(tileKey(p)) && canConnect(curr, p) && !seen.has(tileKey(p)));
            if (nexts.length !== 1) { strict = false; break; }
            curr = nexts[0];
            seen.add(tileKey(curr));
            chain.push(tileKey(curr));
          }
          if (strict) { state.chainStrict = true; return chain; }
        }
      }
      // fallback longest BFS
      const prev = new Map();
      const dist = new Map([[foyerKey, 0]]);
      const queue = [FOYER_TILE];
      let farthest = foyerKey;
      let maxD = 0;
      while (queue.length) {
        const pos = queue.shift();
        for (const next of adjacentInBounds(pos)) {
          const key = tileKey(next);
          if (!dist.has(key) && reachable.has(key) && canConnect(pos, next)) {
            dist.set(key, dist.get(tileKey(pos)) + 1);
            prev.set(key, tileKey(pos));
            queue.push(next);
            if (dist.get(key) > maxD) { maxD = dist.get(key); farthest = key; }
          }
        }
      }
      const chain = [farthest];
      while (chain[0] !== foyerKey) chain.unshift(prev.get(chain[0]));
      return chain;
    }

    function wouldDisconnect(pos, reachable) {
      if (!reachable) reachable = reachableFromFoyer();
      const key = tileKey(pos);
      if (key === tileKey(FOYER_TILE)) return true;
      const tile = tileAt(pos);
      if (!tile) return false;
      const origDestroyed = tile.destroyed;
      tile.destroyed = true;
      const after = reachableFromFoyer();
      tile.destroyed = origDestroyed;
      for (const k of reachable) {
        if (k !== key && !after.has(k)) return true;
      }
      return false;
    }

    function isDestabiliseEligible(pos) {
      if (isFoyerTile(pos)) return false; // 入口 cell 永久 locked
      const tile = tileAt(pos);
      if (!tile) return false;
      if (tile.destroyed) return false;
      if (tile.content === "empty") return false;
      // 注:juatalotli 锁牌已在 0.5 PN 废除,不再免疫塌陷
      if (tile.rewardLocked) return false; // Xipocado's Console 房不进普通随机池;0.5 关庙另有必定结算
      if (tile.content === "path") return true;
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return false;
      if (meta.destabiliseEligible === false) return false;
      // Reward rooms 受保护(简化:oneShot reward 算 unaccessed protected)
      if (meta.oneShot && meta.category === "reward") return false;
      return true;
    }

    // 选目标:
    //   mode = "chain-end"  默认 — 从链末端开始(deterministic,我们建模的「不留孤儿」规则)
    //   mode = "random"      — 在 destabilise-eligible 上均匀随机(用于 Monte Carlo 蛇形稳定性测试)
    //
    // round v 修(2026-05-19 用户提出):**逐步选 + 重算拓扑**。
    //   之前一次性选 N 个但只用初始 reachable 算 cut-vertex,这是错的 —
    //   选完第 1 个后拓扑变了,第 2 个的 cut-vertex 性质可能变。
    //   现在:每选 1 个先重新算 reachable / dist / cut-vertex,再决定下一个。
    //
    // selectDestabiliseTargets 现在是 "干跑预览" — 在 snapshot 上跑逐步选择,返回 picks 但不改 state。
    // 真实的逐步选+应用合并在 applyDestabiliseBatch 内,真正改 state。
    // 塌陷选择模式 3 种(任务 #54,2026-05-19):
    //   chain-end:确定从最远端开始(wiki L188 直接描述,链尾先吃)
    //   random:均匀随机(wiki L175 描述,玩家体验"随机塌陷")
    //   weighted:加权随机,dist 越大权重越大(中间态,远端更易被选但近端仍有概率)
    // 真实 0.5 选择规则未知,3 种都跑可看策略对哪种模式敏感。
    function _selectOneDestabilise(ruleSet, mode) {
      const reachable = reachableFromFoyer();
      const dist = tileChainDistance();
      const candidates = [];
      for (const key of reachable) {
        const pos = parseKey(key);
        if (isDestabiliseEligible(pos)) {
          candidates.push({ pos, key, d: dist.get(key) ?? 0 });
        }
      }
      if (!candidates.length) return null;
      if (mode === "random") {
        const idx = Math.floor(rnd() * candidates.length);
        return _toPick(candidates[idx], ruleSet, reachable);
      }
      if (mode === "weighted") {
        // 按 dist 加权(远端权重大),dist=0 也加 1 保证 foyer 邻居有最小概率
        const weights = candidates.map(c => c.d + 1);
        const total = weights.reduce((a, b) => a + b, 0);
        let r = rnd() * total;
        for (let i = 0; i < candidates.length; i++) {
          r -= weights[i];
          if (r <= 0) return _toPick(candidates[i], ruleSet, reachable);
        }
        return _toPick(candidates[candidates.length - 1], ruleSet, reachable);
      }
      // chain-end 模式:按距 foyer 远近排序,从远端开始尝试
      candidates.sort((a, b) => b.d - a.d);
      for (const c of candidates) {
        const pick = _toPick(c, ruleSet, reachable);
        if (pick) return pick;
      }
      return null;
    }
    function _toPick(c, ruleSet, reachable) {
      const disconnects = wouldDisconnect(c.pos, reachable);
      const tile = tileAt(c.pos);
      // 0.4 跳过 cut vertex(不破坏链)
      if (ruleSet === "0.4" && disconnects) return null;
      // round v.9 (任务 #53,2026-05-19):path 在 cut vertex 位置,0.5 downgrade 是 no-op(path → path),
      // 跟 0.4 一样跳过。否则塌陷算法在 path 上"白吃 count",sidechain 中部 path 永远不被破坏 = 不真实优势。
      // wiki L186-188 "cannot leave previously connected room dependent on a disconnected" 也支持跳过 path-cut-vertex。
      if (disconnects && tile.content === "path") return null;
      return { key: c.key, pos: c.pos, disconnects, mode: disconnects ? "downgrade" : "remove" };
    }

    // 预览版:用临时 state 跑逐步选择,返回 picks 不改 state
    function selectDestabiliseTargets(count, ruleSet, opts = {}) {
      const mode = opts.mode ?? "chain-end";
      const snap = snapshot();
      const picks = [];
      for (let i = 0; i < count; i++) {
        const pick = _selectOneDestabilise(ruleSet, mode);
        if (!pick) break;
        // 模拟应用,让下次迭代基于新拓扑
        const tile = tileAt(pick.pos);
        if (pick.mode === "downgrade") { tile.content = "path"; tile.tier = 0; }
        else { tile.destroyed = true; }
        picks.push(pick);
        // cascade: 失去连接的 path 也标 destroyed
        _cascadeDisconnectedPaths();
      }
      restore(snap);
      return picks;
    }

    function _cascadeDisconnectedPaths() {
      const reachable = reachableFromFoyer();
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const t = state.tiles[r][c];
        if (t.destroyed) continue;
        if (t.content !== "path") continue;
        if (isFoyerTile({ row: r, col: c })) continue;
        const k = tileKey({ row: r, col: c });
        if (!reachable.has(k)) t.destroyed = true;
      }
    }

    function applyPickToTile(pick) {
      const tile = tileAt(pick.pos);
      if (!tile) return;
      if (pick.mode === "downgrade") {
        tile.content = "path";
        tile.tier = 0;
        tile.rewardLocked = false;
      } else {
        tile.destroyed = true;
      }
      tile.medallion = null;
      _cascadeDisconnectedPaths();
    }

    function restrictedRoomClosePick(pos, reachable) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || !tile.rewardLocked) return null;
      const key = tileKey(pos);
      if (!reachable.has(key)) return null;
      const disconnects = wouldDisconnect(pos, reachable);
      return { key, pos, disconnects, mode: disconnects ? "downgrade" : "remove", source: "restricted-close" };
    }

    function applyAccessibleRestrictedRoomCloseDestabilise(ruleSet = "0.5") {
      if (ruleSet !== "0.5") return { picks: [] };
      const picks = [];
      // Royal Prerogative:本轮已 roll 出免疫的 reward 房,后续迭代跳过(否则同一格被无限重选)。
      const immuneKeys = new Set();
      for (;;) {
        const reachable = reachableFromFoyer();
        let pick = null;
        // 按 row-major(键 "r,c" 字典序)迭代,与 Python sorted(reachable) 对齐 → 多个可达 reward 房时 RP 免疫 roll 顺序两端一致(避免 rng 错位)。
        for (const key of [...reachable].sort()) {
          if (immuneKeys.has(key)) continue;
          pick = restrictedRoomClosePick(parseKey(key), reachable);
          if (pick) break;
        }
        if (!pick) break;
        // Royal Prerogative:reward 房 15% 免疫 → 标记跳过,房存活,继续找下一个。
        if (rollRewardPrerogativeImmune(pick.pos)) {
          immuneKeys.add(pick.key);
          pick.mode = "immune";
          picks.push(pick);
          continue;
        }
        applyPickToTile(pick);
        picks.push(pick);
      }
      if (picks.length) {
        state.destabiliseLog.unshift({
          ruleSet,
          requested: picks.length,
          applied: picks.length,
          picks: picks.map(p => ({ key: p.key, mode: p.mode, source: p.source })),
          locksConsumed: 0,
          timestamp: Date.now()
        });
        if (state.destabiliseLog.length > 6) state.destabiliseLog.length = 6;
      }
      return { picks };
    }

    // round v.8 (任务 #52,2026-05-19):锁牌一次性消耗。
    // wiki: "Juatalotli's Medallion: Use to prevent the next Destabilisation of a Room"
    // 0.5 PN: juatalotli 锁牌已废除,不再挡塌陷也不再消耗。
    function applyDestabiliseBatch(count, ruleSet, opts = {}) {
      if (!ruleSet) ruleSet = el("ruleSet").value;
      const mode = opts.mode ?? "chain-end";
      const picks = [];
      // 逐步塌陷
      for (let i = 0; i < count; i++) {
        const pick = _selectOneDestabilise(ruleSet, mode);
        if (!pick) break;
        // Royal Prerogative:reward 房 15% 免疫。免疫则跳过(本次塌陷次数照常消耗,房存活)。
        if (rollRewardPrerogativeImmune(pick.pos)) {
          pick.mode = "immune";
          picks.push(pick);
          continue;
        }
        applyPickToTile(pick);
        picks.push(pick);
      }
      const locksConsumed = 0;
      state.destabiliseLog.unshift({
        ruleSet, requested: count, applied: picks.length,
        picks: picks.map(p => ({ key: p.key, mode: p.mode })),
        locksConsumed,
        timestamp: Date.now()
      });
      if (state.destabiliseLog.length > 6) state.destabiliseLog.length = 6;
      return { picks, locksConsumed };
    }

    // 暗杀升级机制(poe2wiki line 786):
    //   开门时:神庙中 ≥2 个可达 + 可塌陷 + 未被暗杀升级过的 Spymaster → 选 1 个最低 tier 的"暗杀"(变空格/已销毁,自动完成);
    //          另选 1 个 Spymaster 作为关门升级目标,记录到 state.pendingAssassinateUpgrade
    //   关门时:对 pendingAssassinateUpgrade 标记的 Spymaster tier +1,设置 assassinateUpgraded=true(终身一次)
    // 不依赖邻接 — 只要神庙中有 ≥2 个 Spymaster 即触发
    function applyEnterTempleSpymasterAssassinate() {
      const reachable = reachableFromFoyer();
      const candidates = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        if (tile.content !== "spymaster") continue;
        if (!reachable.has(tileKey(pos))) continue;
        if (tile.assassinateUpgraded) continue;
        candidates.push({ pos, tier: tile.tier ?? 1, key: tileKey(pos) });
      }
      if (candidates.length < 2) return null;
      // 暗杀目标 = 最低 tier(同 tier 时取第一个);升级目标 = 剩下最高 tier
      candidates.sort((a, b) => a.tier - b.tier);
      const assassinated = candidates[0];
      const upgradeTarget = candidates[candidates.length - 1];
      const aTile = tileAt(assassinated.pos);
      aTile.content = "empty";
      aTile.tier = 0;
      aTile.destroyed = true;  // auto-completed = 不再可塌陷
      aTile.medallion = null;
      state.pendingAssassinateUpgrade = upgradeTarget.key;
      return { assassinated: assassinated.key, upgradeTarget: upgradeTarget.key };
    }

    function applyCloseTempleSpymasterUpgrade() {
      if (!state.pendingAssassinateUpgrade) return null;
      const pos = parseKey(state.pendingAssassinateUpgrade);
      state.pendingAssassinateUpgrade = null;
      if (!pos) return null;
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content !== "spymaster") return null;
      if (tile.assassinateUpgraded) return null;
      const meta = ROOM_TYPES[tile.content];
      if (tile.tier >= effectiveMaxTier(meta)) {
        tile.assassinateUpgraded = true;
        return { upgraded: tileKey(pos), newTier: tile.tier, note: "already at effective maxTier" };
      }
      tile.tier += 1;
      tile.assassinateUpgraded = true;
      autoUpgradeAll();
      return { upgraded: tileKey(pos), newTier: tile.tier };
    }

    // 阿兹里击杀:摧毁所有 Royal Access Chamber 房(poe2wiki line 296)
    // 普通塌陷不会动它(destabiliseEligible:false),只有这里显式销毁。
    function destroyRoyalAccessChambers() {
      const destroyed = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        if (tile.content !== "royal_access_chamber") continue;
        tile.content = "empty";
        tile.tier = 0;
        tile.destroyed = true;
        tile.medallion = null;
        destroyed.push(tileKey(pos));
      }
      return destroyed;
    }

    function applyDestabilize(pos) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty") return;
      // 0.5 PN:锁牌(Juatalotli)不再防塌陷,贴锁的格子照样塌 — 不再跳过 tile.medallion。
      // Royal Prerogative(Atlas 全点):reward 房 15% 免疫,roll 命中则本次塌陷无效(房存活)。
      if (rollRewardPrerogativeImmune(pos)) return;
      const ruleSet = el("ruleSet").value;
      const reachable = reachableFromFoyer();
      if (!reachable.has(tileKey(pos))) {
        tile.destroyed = true;
        return;
      }
      const disconnects = wouldDisconnect(pos, reachable);
      if (disconnects) {
        if (ruleSet === "0.5") { tile.content = "path"; tile.tier = 0; }
        return;
      }
      tile.destroyed = true;
    }

    // 仅历史/非掉落用 — 不再被 collectMedallions 调用(掉落改走 GGPK medallionDrops 子集)。
    // 保留仅为 atziri-temple-sim.test.mjs 历史回归断言。
    function rollMedallionType() {
      const r = rnd();
      let acc = 0;
      for (const t of MEDALLION_TYPES) {
        acc += MEDALLION_DROP_WEIGHTS[t];
        if (r < acc) return t;
      }
      return "juatalotli";
    }

    function stickJuatalotli(pos) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty") return;
      if (tile.medallion === "juatalotli") {
        tile.medallion = null;
        state.medallionPool.juatalotli += 1;
      } else if (!tile.medallion) {
        if (state.medallionPool.juatalotli <= 0) return;
        tile.medallion = "juatalotli";
        state.medallionPool.juatalotli -= 1;
      }
    }

    // 0.5 PN:T4 仅在 Temple Atlas Tree 解锁后开放。effectiveMaxTier 给升级 / 自动升 / 强升的 cap。
    // 数据 maxTier 默认 4(t4Unlockable 房);未解锁时 cap 在 3。手动放置(planner state-setup)不走这道闸。
    function effectiveMaxTier(meta) {
      const baseCap = state.t4Unlocked ? 4 : 3;
      return Math.min(meta.maxTier ?? 0, baseCap);
    }

    function consumeQuipolatl(pos) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed || tile.content === "empty" || tile.content === "path") return false;
      if (state.medallionPool.quipolatl <= 0) return false;
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return false;
      if (tile.tier >= effectiveMaxTier(meta)) return false;
      state.medallionPool.quipolatl -= 1;
      tile.tier += 1;
      autoUpgradeAll();
      return true;
    }

    // Zantipi 实际作用(poe2wiki line 191):给当前神庙加 1 个随机 waystone 词条,最多 8 个,每开 10 个神庙减 1。
    // 不是给某个房 +mod。本函数仅消耗资源 + 累加 waystoneModCount,不改 tile.mods。
    // tile.mods 的"强化"语义改为手动 UI 规划用,不由 Zantipi 驱动。
    function consumeZantipi() {
      if (state.medallionPool.zantipi <= 0) return false;
      if ((state.waystoneModCount ?? 0) >= 8) return false;
      state.medallionPool.zantipi -= 1;
      state.waystoneModCount = (state.waystoneModCount ?? 0) + 1;
      return true;
    }

    // Estazunti(poe2wiki line 156):击杀建筑师后,本次可放的 Restricted Room 卡多 1 个。
    // 模型:加一个 pending 计数,在 architectKill 后被 placeRewardRoomFromConsole 读取。
    function consumeEstazunti() {
      if (state.medallionPool.estazunti <= 0) return false;
      state.medallionPool.estazunti -= 1;
      state.estazuntiExtraSlots = (state.estazuntiExtraSlots ?? 0) + 1;
      return true;
    }

    // Hayoxi(poe2wiki line 161):重新随机 Restricted Room 卡的奖励(同一张卡的具体奖励物变)。
    // 模型:仅计数。我们不模拟 reward 卡的具体内容,只记可重抽次数。
    function consumeHayoxi() {
      if (state.medallionPool.hayoxi <= 0) return false;
      state.medallionPool.hayoxi -= 1;
      state.hayoxiPendingRerolls = (state.hayoxiPendingRerolls ?? 0) + 1;
      return true;
    }

    // Uromoti(poe2wiki line 181):加一个随机房间到手牌。
    // 抽手牌的候选过滤:
    //   - 排除 entrance/path 模板项
    //   - 排除 oneShot reward(金库等,放完即消)
    //   - 排除 fixedSlot
    //   - 排除 transformsFrom(Transcendent/Legion 仅由 Garrison 转换形成,不发牌)
    //   - 排除 destabiliseEligible=false 的 Restricted Room(Royal Access 等,只能从 Console 放)
    function isHandDrawable(r) {
      if (!r || r.id === "entrance" || r.id === "path") return false;
      if (r.oneShot || r.fixedSlot) return false;
      if (r.transformsFrom) return false;
      if (r.destabiliseEligible === false) return false;
      return true;
    }

    function consumeUromoti() {
      if (state.medallionPool.uromoti <= 0) return false;
      state.medallionPool.uromoti -= 1;
      const basePool = TEMPLE_DATA.rooms.filter(isHandDrawable);
      if (!basePool.length) return false;
      const pick = basePool[Math.floor(rnd() * basePool.length)].id;
      // 找一个空 hand slot 塞进去
      for (let i = 0; i < state.hand.length; i++) {
        if (!state.hand[i]) {
          state.hand[i] = pick;
          return true;
        }
      }
      // 手牌满 → 扩张一格
      state.hand.push(pick);
      return true;
    }

    function consumePuhuarte() {
      if (state.medallionPool.puhuarte <= 0) return false;
      state.medallionPool.puhuarte -= 1;
      drawHand();
      return true;
    }

    function collectMedallions() {
      // GGPK 掉源模型(2026-06-03 一手解码落地,取代旧"仅 Spymaster 掉 + 扁平 9 选 1 全局池"错误模型):
      // 遍历所有可达房,凡带 medallionDrops 且 tier>0 的,按该房该 tier 的子集掉。
      // 子集 = medallionDrops[String(min(tier,4))];该 tier 键不存在(如转换房 legion_barrack 无 "1")
      // 则跳过该房不掉、且不消费 rng。
      //
      // ⚠ PARITY(跟 Python collect_medallions 必须 bit-for-bit 一致):
      //   - 同序遍历 = reachable 按 grid row-major(row*GRID_SIZE+col)升序;
      //   - 同序消费 rng = 每个"有效掉源房"先 1 次 rate-check,掉中再 1 次 pick-index;
      //     跳过的房(无 medallionDrops / tier<=0 / 该 tier 无子集)一律不消费 rng。
      // PLACEHOLDER-05:子集内均匀抽 1 个(GGPK 不给子集内权重),待实测校准。
      const reachable = reachableFromFoyer();
      const positions = [];
      for (const key of reachable) {
        const pos = parseKey(key);
        if (pos) positions.push(pos);
      }
      positions.sort((a, b) => (a.row * GRID_SIZE + a.col) - (b.row * GRID_SIZE + b.col));
      let gain = 0;
      for (const pos of positions) {
        const tile = tileAt(pos);
        if (!tile || tile.destroyed || tile.tier <= 0) continue;
        const meta = ROOM_TYPES[tile.content];
        const drops = meta && meta.medallionDrops;
        if (!drops) continue;
        const tierKey = String(Math.min(tile.tier, 4));
        const subset = drops[tierKey];
        if (!subset || subset.length === 0) continue; // 该 tier 无掉源(如 legion_barrack T1)→ 不消费 rng
        const rate = MEDALLION_DROP_RATE_BY_TIER[Math.min(tile.tier, 4) - 1] ?? 0;
        if (rnd() < rate) {
          const type = subset[Math.floor(rnd() * subset.length)];
          state.medallionPool[type] = (state.medallionPool[type] ?? 0) + 1;
          gain += 1;
        }
      }
      return gain;
    }

    function drawHand() {
      const basePool = TEMPLE_DATA.rooms.filter(isHandDrawable);
      // 用户观察(2026-05-18):实际游戏的优质布局是房间密集 + 极少 path(因为 wiki line 1036:
      // "rooms that interact will automatically connect to each other" — 互动房直接连通)。
      // path 权重是本地模型假设,用于避免手牌过度偏向通路。**待 0.5 上线游戏内验证真实分布**。
      const weighted = basePool.map(r => r.id);
      for (let i = 0; i < 3; i++) weighted.push("path");
      state.hand = [];
      for (let i = 0; i < HAND_SIZE; i++) {
        state.hand.push(weighted[Math.floor(rnd() * weighted.length)]);
      }
    }

    function playCard(handIdx, pos) {
      if (handIdx < 0 || handIdx >= state.hand.length) return false;
      const cardId = state.hand[handIdx];
      if (!cardId) return false;
      const tile = tileAt(pos);
      if (!tile) return false;
      // 游戏机制(2026-05-19 用户确认):玩家手牌不能放在已占用格子。
      // 降级为通路的房间(或任何 path/room)必须等下轮塌陷清掉(destroyed=empty)才能再放。
      if (!tile.destroyed && tile.content !== "empty") return false;
      if (cardId === "path") {
        placePath(pos);
      } else {
        placeRoom(pos, cardId, 1);
      }
      state.hand[handIdx] = null;
      autoUpgradeAll();
      return true;
    }

    function generatorRange(tile) {
      const meta = ROOM_TYPES[tile.content];
      const arr = meta?.powerRangeByTier;
      if (!Array.isArray(arr) || arr.length === 0 || tile.tier <= 0) return 0;
      return arr[Math.min(tile.tier - 1, arr.length - 1)];
    }

    function poweredTiles(reachable) {
      const powered = new Set();
      const counts = new Map();
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        if (tile.content !== "generator" || tile.destroyed) continue;
        if (!reachable.has(tileKey(pos))) continue;
        const range = generatorRange(tile);
        if (range <= 0) continue;
        for (let rr = 0; rr < GRID_SIZE; rr++) for (let cc = 0; cc < GRID_SIZE; cc++) {
          const md = Math.abs(rr - r) + Math.abs(cc - c);
          if (md <= range) {
            const targetTile = tileAt({ row: rr, col: cc });
            if (!targetTile.destroyed) {
              const key = tileKey({ row: rr, col: cc });
              powered.add(key);
              counts.set(key, (counts.get(key) ?? 0) + 1);
            }
          }
        }
      }
      powered.counts = counts;
      return powered;
    }

    function hasRequiredPower(pos, powered) {
      const tile = tileAt(pos);
      const meta = ROOM_TYPES[tile?.content];
      if (!meta?.needsPower) return true;
      const required = Math.max(1, meta.powerCount ?? 1);
      return (powered.counts?.get(tileKey(pos)) ?? (powered.has(tileKey(pos)) ? 1 : 0)) >= required;
    }

    function amplifiedTiles(reachable, powered) {
      const amplified = new Map();
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const tile = tileAt(pos);
        const meta = ROOM_TYPES[tile.content];
        if (!meta?.amplifies?.length) continue;
        if (!reachable.has(tileKey(pos)) || !hasRequiredPower(pos, powered)) continue;
        const range = meta.amplifyRangeByTier ? meta.amplifyRangeByTier[Math.min(tile.tier - 1, meta.amplifyRangeByTier.length - 1)] : 4;
        const mult = meta.amplifyMultByTier ? meta.amplifyMultByTier[Math.min(tile.tier - 1, meta.amplifyMultByTier.length - 1)] : 1.5;
        if (tile.tier <= 0) continue;
        for (let rr = 0; rr < GRID_SIZE; rr++) for (let cc = 0; cc < GRID_SIZE; cc++) {
          const targetPos = { row: rr, col: cc };
          const targetTile = tileAt(targetPos);
          if (!meta.amplifies.includes(targetTile.content)) continue;
          if (!reachable.has(tileKey(targetPos))) continue;
          const md = Math.abs(rr - r) + Math.abs(cc - c);
          if (md <= range) {
            const k = tileKey(targetPos);
            amplified.set(k, (amplified.get(k) ?? 1) * mult);
          }
        }
      }
      return amplified;
    }
