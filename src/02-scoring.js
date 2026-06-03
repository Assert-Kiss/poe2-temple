    // ===== mod stack-based scoring =====
    // 每个 mod 房贡献 modBonus.byTier[tier-1]% 到对应 stat。放大器(spymaster/golem_works/thaumaturge)
    // 的 mod_amp_* stat 不进 stack — 它们的效果通过 amplifiedTiles() 已乘到被放大房的 mod % 上了。
    // amp × Zantipi × strategy weight 串联,然后跨房间在每个 stat 上累加。
    //
    // 组内边际递减(来自 IDA loot 函数 sub_1425BEA80 / EA sub_1425BA980,一字节不差):
    // 同一房型(content id)的多个产出房贡献不是简单累加,而是按房型分组、组内排序后,
    // 前 3 个房系数 ×1.0,第 4 个起每个 ×0.9 累乘(第4个 0.9、第5个 0.81、第6个 0.729…),
    // 该衰减系数乘到该房的全部 mod 贡献。排序键:tier 降序(IDA 分组元素含 tile tier 字段 +
    // "高价值前 3 满额"的设计意图;精确排序函数未完全定位,但边际递减机制确凿)。
    function computeModStack(reachable, powered, amplified, strategy) {
      const stack = new Map();
      // 1) 先按房型(content)分组收集 reachable 内的产出房(含 modBonus 且 tier>0)
      const groups = new Map();
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const pos = { row: r, col: c };
        const key = tileKey(pos);
        if (!reachable.has(key)) continue;
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        const meta = ROOM_TYPES[tile.content];
        if (!meta?.modBonus?.length) continue;
        if (tile.tier <= 0) continue;
        if (!groups.has(tile.content)) groups.set(tile.content, []);
        groups.get(tile.content).push({ pos, key, tile, meta });
      }
      // 2) 每组内按 tier 降序排序(tier 相同保持稳定顺序,按 tileKey 升序)
      for (const members of groups.values()) {
        members.sort((a, b) => (b.tile.tier - a.tile.tier) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
        // 3) 第 k 个房(0-indexed):前 3 个 ×1.0,第 4 个起 ×0.9^(k-2)
        for (let k = 0; k < members.length; k++) {
          const { pos, key, tile, meta } = members[k];
          const decayFactor = k < 3 ? 1.0 : Math.pow(0.9, k - 2);
          const ampMult = amplified.get(key) ?? 1;
          // Atlas 全点 modBonus 缩放(Power Relays ×1.2 / Efficient Arteries ×1.2 / Xipocado 第1房 ×2.5)。
          // k===0 = 该 content 组排序后第 1 房(Xipocado per-type)。⚠ temple_bonus 语义=房间 modBonus 缩放,
          // 为本地推断,待游戏实测确认(见 atlasFullClear.applied.templeBonusScaling)。
          const atlasMult = atlasModMult(pos, k === 0);
          const modsMult = 1 + (tile.mods || 0) * MODS_PER_ZANTIPI;
          // poe2wiki:Generator 供能给 Smithy/Synthflesh/Transcendent +1 effective tier(不是 off-when-unpowered)
          // 即:powered T1 房用 T2 的 modBonus 数字;powered T3 维持 T3(已封顶)
          const effectiveTier = meta.needsPower && hasRequiredPower(pos, powered)
            ? Math.min(tile.tier + 1, meta.modBonus[0]?.byTier?.length ?? tile.tier + 1)
            : tile.tier;
          for (const entry of meta.modBonus) {
            if (entry.stat.startsWith("mod_amp_")) continue;
            const tierIdx = Math.max(0, Math.min(effectiveTier - 1, entry.byTier.length - 1));
            const basePct = (entry.byTier[tierIdx] || 0) / 100;
            if (basePct <= 0) continue;
            const weighted = basePct * ampMult * modsMult * statWeight(strategy, entry.stat) * decayFactor * atlasMult;
            stack.set(entry.stat, (stack.get(entry.stat) ?? 0) + weighted);
          }
        }
      }
      return stack;
    }

    // 不同 stat 独立乘积 — 像怪掉落:rarity 乘 quantity 乘 gold 乘…… 各自独立 buff
    function expectedLootMultiplier(stack) {
      let M = 1;
      for (const pct of stack.values()) M *= (1 + pct);
      return M;
    }

    function vaultValueSum(reachable) {
      let sum = 0;
      for (const key of reachable) {
        const pos = parseKey(key);
        const tile = tileAt(pos);
        if (!tile || tile.destroyed) continue;
        const meta = ROOM_TYPES[tile.content];
        if (!meta || meta.category !== "reward") continue;
        const base = VAULT_VALUE_CLASS[meta.valueClass] ?? 0;
        sum += base * (1 + (tile.tier || 0) * 0.4);
      }
      return sum;
    }

    // 单个房间的「自身基础贡献分」— 用于排序/snake 高价值判定。不算 amp/Zantipi/strategy。
    // 单位 = 把 byTier % 直接加起来(T3 Smithy = 60,T3 Spymaster = 30,T3 Garrison = 50)。
    function roomValue(pos) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed) return 0;
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return 0;
      if (tile.tier <= 0) return 0;
      if (meta.category === "reward") {
        // reward vault 用 class 表
        return VAULT_VALUE_CLASS[meta.valueClass] ?? 0;
      }
      if (!meta.modBonus?.length) {
        return VAULT_VALUE_CLASS[meta.valueClass] ?? 0;
      }
      let total = 0;
      for (const entry of meta.modBonus) {
        const tierIdx = Math.max(0, Math.min(tile.tier - 1, entry.byTier.length - 1));
        total += entry.byTier[tierIdx] || 0;
      }
      return total;
    }

    // 单房在当前布局下的「分」— 反映这间房对全局收益的贡献(纯展示用)。
    // mod 房:Σ(byTier × amp × Zantipi × strategyWeight)。reward vault:class 基值 × tier 增益。放大器:Σ(被覆盖房 byTier) × amp%。
    // 注意:同房型组内边际递减(前 3 满额、第 4 起 ×0.9^(k-2),来自 IDA loot 函数 sub_1425BEA80)
    // 只在组层体现(computeModStack / lootMult / totalScore),单房展示分不含衰减 —
    // 单房分不知道自己在房型组里排第几,展示用故意保持"满额"近似。
    function scoreTile(pos, reachable, powered, amplified, ruleSet) {
      const tile = tileAt(pos);
      if (!tile || tile.destroyed) return 0;
      if (tile.content === "empty" || tile.content === "path") return 0;
      const meta = ROOM_TYPES[tile.content];
      if (!meta) return 0;
      const key = tileKey(pos);
      if (!reachable.has(key)) {
        return ruleSet === "0.5" ? -roomValue(pos) * 0.55 : -1;
      }
      const strategy = el("strategy").value;
      const manual = tile.manualWeight || 0;

      // reward vault: 一次性掉落基准 × tier 加权
      if (meta.category === "reward") {
        const base = VAULT_VALUE_CLASS[meta.valueClass] ?? 0;
        return base * (1 + (tile.tier || 0) * 0.4) + manual;
      }

      if (!meta.modBonus?.length) return manual;
      if (tile.tier <= 0) return manual;

      const ampMult = amplified.get(key) ?? 1;
      const modsMult = 1 + (tile.mods || 0) * MODS_PER_ZANTIPI;
      // poe2wiki:powered needsPower 房用 +1 effective tier 计算 mod(不是 off-when-unpowered)
      const effectiveTier = meta.needsPower && hasRequiredPower(pos, powered)
        ? Math.min(tile.tier + 1, meta.modBonus[0]?.byTier?.length ?? tile.tier + 1)
        : tile.tier;

      // 1) 这间房自带 mod 词条的加权贡献(stat 累加)
      let directPct = 0;
      let ampOwnPct = 0;
      for (const entry of meta.modBonus) {
        const tierIdx = Math.max(0, Math.min(effectiveTier - 1, entry.byTier.length - 1));
        const basePct = (entry.byTier[tierIdx] || 0) / 100;
        if (basePct <= 0) continue;
        if (entry.stat.startsWith("mod_amp_")) {
          ampOwnPct = basePct;
        } else {
          directPct += basePct * ampMult * modsMult * statWeight(strategy, entry.stat);
        }
      }
      let contribution = directPct * 100;  // 百分比 → 分数

      // 2) 放大器额外算它放大了多少邻房收益(用 roomValue 当代理)
      if (ampOwnPct > 0 && meta.amplifies?.length) {
        const range = meta.amplifyRangeByTier
          ? meta.amplifyRangeByTier[Math.min(tile.tier - 1, meta.amplifyRangeByTier.length - 1)]
          : 4;
        let amplifiedValue = 0;
        for (let rr = 0; rr < GRID_SIZE; rr++) for (let cc = 0; cc < GRID_SIZE; cc++) {
          const targetPos = { row: rr, col: cc };
          const targetTile = tileAt(targetPos);
          if (!targetTile || targetTile.destroyed) continue;
          if (!reachable.has(tileKey(targetPos))) continue;
          if (!meta.amplifies.includes(targetTile.content)) continue;
          const md = Math.abs(rr - pos.row) + Math.abs(cc - pos.col);
          if (md > range) continue;
          amplifiedValue += roomValue(targetPos);
        }
        contribution += amplifiedValue * ampOwnPct;
      }

      return contribution + manual;
    }

    function scoreBreakdown(pos, reachable, powered, amplified, ruleSet) {
      const tile = tileAt(pos);
      const meta = ROOM_TYPES[tile?.content];
      if (!tile || !meta || tile.destroyed || tile.content === "empty" || tile.content === "path") return null;
      const key = tileKey(pos);
      const base = roomValue(pos);
      const strategy = el("strategy").value;
      const powerOk = hasRequiredPower(pos, powered);
      const reachableOk = reachable.has(key);
      const ampMult = amplified.get(key) ?? 1;
      const modsMult = 1 + (tile.mods || 0) * MODS_PER_ZANTIPI;
      const score = scoreTile(pos, reachable, powered, amplified, ruleSet);
      const flags = [];
      if (!reachableOk) flags.push("未连通");
      if (meta.needsPower && !powerOk) flags.push(`缺供能 ${powered.counts?.get(key) ?? 0}/${Math.max(1, meta.powerCount ?? 1)}`);
      if (ampMult > 1) flags.push(`放大 ×${ampMult.toFixed(2)}`);
      if (tile.mods) flags.push(`强化 ×${modsMult.toFixed(2)}`);
      if (tile.medallion) flags.push(MEDALLION_LABEL[tile.medallion] ?? tile.medallion);
      // 描述这间房贡献的 stat + 数值(从 modBonus 读)
      const statBreakdown = (meta.modBonus || []).map(entry => {
        const tierIdx = Math.max(0, Math.min(tile.tier - 1, entry.byTier.length - 1));
        const pct = entry.byTier[tierIdx] || 0;
        if (pct <= 0) return null;
        const weighted = pct * ampMult * modsMult * statWeight(strategy, entry.stat);
        return { stat: entry.stat, basePct: pct, weighted, isAmp: entry.stat.startsWith("mod_amp_") };
      }).filter(Boolean);
      if (meta.t3Special && tile.tier === 3) flags.push(`T3 词条: ${meta.t3Special}`);
      // 给旧字段保留以免 UI 引用炸 — strategyMult 现在指主 stat 的权重(取第一个非 amp stat)
      const primaryStat = statBreakdown.find(s => !s.isAmp);
      const strategyMult = primaryStat ? statWeight(strategy, primaryStat.stat) : 1;
      return { pos, tile, meta, base, strategyMult, ampMult, modsMult, score, flags, statBreakdown };
    }

    function allScoreBreakdowns(ruleSet = "0.5") {
      const cur = totalScore(ruleSet);
      const rows = [];
      for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
        const bd = scoreBreakdown({ row: r, col: c }, cur.reachable, cur.powered, cur.amplified, ruleSet);
        if (bd) rows.push(bd);
      }
      rows.sort((a, b) => b.score - a.score);
      return { cur, rows };
    }
