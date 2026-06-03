
    // ===== End-state goal templates 与 goal-directed planner =====
    //
    // 每个 template 定义最终成型时神庙应该长什么样:
    //   - layoutSpec: 每个 grid 格子的期望内容 {row, col, content, tier, medallion?, rewardLocked?}
    //   - description: 简介
    //   - exitStrategy: 推荐每次进神庙的退出方式("close" / "architect" / "atziri")
    //   - milestones: 阶段性目标(用于进度展示)
    //
    // 三个内置 template — 用户可挑一个,planner 就为它服务。
    // 辅助:用 Map 去重 — 同位置后写覆盖先写,最后转 array
    function _buildSpec(entries) {
      const map = new Map();
      for (const e of entries) {
        map.set(`${e.row},${e.col}`, e);
      }
      const list = [...map.values()];
      // #106 Bug 2: 自动给每个 entry 补 role(若没显式写).
      // 规则跟 Python 端 patch_best_role.py / generators.py 一致:
      //   architect_chamber / atziri_chamber → meta
      //   5×5 rows 3-7 cols 3-7 → core
      //   其他 → shell
      // 让 UI 内置载入的语义和 results/*.json 加载一致,避免 computeCombatAdvice
      // 用 role 判核心/诱饵时内置模板被错分.
      for (const e of list) {
        if (e.role) continue;  // 模板已显式标的不改
        if (e.content === "architect_chamber" || e.content === "atziri_chamber") {
          e.role = "meta";
        } else if (3 <= e.row && e.row <= 7 && 3 <= e.col && e.col <= 7) {
          e.role = "core";
        } else {
          e.role = "shell";
        }
      }
      return list;
    }

    var GOAL_TEMPLATES = {
      // ===== 核心堡垒循环 Core-Shell Cycle (2026-05-19,Python 阶段 3.5 sweep 验证) =====
      // Plan A 候选策略(假定塌陷 = random/weighted).基于 540 变体 sweep + 25 seeds robustness + replay.
      // 玩家一句话:先在中上部建 5×5 收益核心,远端铺满低价值诱饵壳;
      //           每轮进庙先修核心,核心完整后再补诱饵和锁最高价值房,不主动打 Atziri.
      // 操作优先级(random/weighted 下):core-first repair > 远端 filled > lock highest
      // chain-end 下 policy 不解决问题 — 要切 layout. 2026-05-25 Python FSM 复测后:
      //   Plan A 仍是 random/weighted 默认;Plan A+b2 hybrid / b2 shell 是链尾专用.
      //   Plan A+b2 hybrid: random/weighted 20.39,chain-end 45.69,不是默认解.
      //   (旧 124/148/5.9 buggy 数据已废 — 那时 repair 一卡神奇恢复 T3 + tier 启发分类系统性高估.)

      "core-shell-cycle": {
        label: "★ Plan A 核心堡垒(random/weighted 主推)",
        description: "**5×5 中上收益核心 + 满诱饵壳**。Plan A — 实测塌陷接近 random / weighted 时主推。\n\n**Python FSM 复测(3 seeds × 8 trials × visits=25/50)**:\n- 综合分 **48.26**\n- random/weighted **78.46** ✓\n- chain-end 33.71,若 Probe 明确偏 chain-end 切“链尾专用”方案\n\n**每轮**:先修核心破格 → 补远端诱饵 → 锁核心高价值。**不主动通 Atziri**。详 [current-candidates-fsm-compare.json](results/current-candidates-fsm-compare.json)。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: _buildSpec([
            { row: 3, col: 3, content: "alchemy_lab", tier: 3 },
            { row: 3, col: 4, content: "thaumaturge", tier: 1 },
            { row: 3, col: 5, content: "alchemy_lab", tier: 3 },
            { row: 3, col: 6, content: "thaumaturge", tier: 1 },
            { row: 3, col: 7, content: "alchemy_lab", tier: 3 },
            { row: 4, col: 3, content: "thaumaturge", tier: 1 },
            { row: 4, col: 4, content: "alchemy_lab", tier: 3 },
            { row: 4, col: 5, content: "thaumaturge", tier: 1 },
            { row: 4, col: 6, content: "alchemy_lab", tier: 3 },
            { row: 4, col: 7, content: "thaumaturge", tier: 1 },
            { row: 5, col: 3, content: "alchemy_lab", tier: 3 },
            { row: 5, col: 4, content: "thaumaturge", tier: 1 },
            { row: 5, col: 5, content: "alchemy_lab", tier: 3 },
            { row: 5, col: 6, content: "thaumaturge", tier: 1 },
            { row: 5, col: 7, content: "alchemy_lab", tier: 3 },
            { row: 6, col: 3, content: "thaumaturge", tier: 1 },
            { row: 6, col: 4, content: "alchemy_lab", tier: 3 },
            { row: 6, col: 5, content: "thaumaturge", tier: 1 },
            { row: 6, col: 6, content: "alchemy_lab", tier: 3 },
            { row: 6, col: 7, content: "thaumaturge", tier: 1 },
            { row: 7, col: 3, content: "alchemy_lab", tier: 3 },
            { row: 7, col: 4, content: "thaumaturge", tier: 1 },
            { row: 7, col: 5, content: "alchemy_lab", tier: 3 },
            { row: 7, col: 6, content: "thaumaturge", tier: 1 },
            { row: 7, col: 7, content: "alchemy_lab", tier: 3 },
            { row: 1, col: 0, content: "armoury", tier: 1 },
            { row: 1, col: 1, content: "garrison", tier: 1 },
            { row: 1, col: 2, content: "armoury", tier: 1 },
            { row: 1, col: 3, content: "garrison", tier: 1 },
            { row: 1, col: 4, content: "thaumaturge", tier: 1 },
            { row: 1, col: 5, content: "alchemy_lab", tier: 1 },
            { row: 1, col: 6, content: "thaumaturge", tier: 1 },
            { row: 1, col: 7, content: "alchemy_lab", tier: 1 },
            { row: 1, col: 8, content: "thaumaturge", tier: 1 },
            { row: 2, col: 0, content: "garrison", tier: 1 },
            { row: 2, col: 1, content: "armoury", tier: 1 },
            { row: 2, col: 2, content: "garrison", tier: 1 },
            { row: 2, col: 3, content: "armoury", tier: 1 },
            { row: 2, col: 4, content: "alchemy_lab", tier: 1 },
            { row: 2, col: 5, content: "thaumaturge", tier: 1 },
            { row: 2, col: 6, content: "alchemy_lab", tier: 1 },
            { row: 2, col: 7, content: "thaumaturge", tier: 1 },
            { row: 2, col: 8, content: "alchemy_lab", tier: 1 },
            { row: 8, col: 0, content: "garrison", tier: 1 },
            { row: 8, col: 1, content: "armoury", tier: 1 },
            { row: 8, col: 2, content: "garrison", tier: 1 },
            { row: 8, col: 3, content: "armoury", tier: 1 },
            { row: 8, col: 5, content: "thaumaturge", tier: 1 },
            { row: 8, col: 6, content: "alchemy_lab", tier: 1 },
            { row: 8, col: 7, content: "thaumaturge", tier: 1 },
            { row: 8, col: 8, content: "alchemy_lab", tier: 1 },
            { row: 3, col: 0, content: "armoury", tier: 1 },
            { row: 3, col: 1, content: "garrison", tier: 1 },
            { row: 3, col: 2, content: "armoury", tier: 1 },
            { row: 3, col: 8, content: "thaumaturge", tier: 1 },
            { row: 4, col: 0, content: "garrison", tier: 1 },
            { row: 4, col: 1, content: "armoury", tier: 1 },
            { row: 4, col: 2, content: "garrison", tier: 1 },
            { row: 4, col: 8, content: "alchemy_lab", tier: 1 },
            { row: 5, col: 0, content: "armoury", tier: 1 },
            { row: 5, col: 1, content: "garrison", tier: 1 },
            { row: 5, col: 2, content: "armoury", tier: 1 },
            { row: 5, col: 8, content: "thaumaturge", tier: 1 },
            { row: 6, col: 0, content: "garrison", tier: 1 },
            { row: 6, col: 1, content: "armoury", tier: 1 },
            { row: 6, col: 2, content: "garrison", tier: 1 },
            { row: 6, col: 8, content: "alchemy_lab", tier: 1 },
            { row: 7, col: 0, content: "armoury", tier: 1 },
            { row: 7, col: 1, content: "garrison", tier: 1 },
            { row: 7, col: 2, content: "armoury", tier: 1 },
            { row: 7, col: 8, content: "thaumaturge", tier: 1 },
            { row: 0, col: 0, content: "architect_chamber", tier: 0 }
        ]),
        milestones: [
          { id: "core-built", label: "5×5 核心 row 3-7 col 3-7 满铺", check: () => {
            let n = 0;
            for (let r = 3; r <= 7; r++) for (let c = 3; c <= 7; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.tier >= 3) n++;
            }
            return n >= 20;  // 至少 20/25 核心格在 T3
          }},
          // 0.5 PN:锁牌已废防塌陷功能 — 删去「核心顶层 3 锁已贴」里程碑(永不达成,且锁不再有意义)。
          { id: "bait-shell-far", label: "远端 row 1-2 诱饵 ≥ 12 房", check: () => {
            let n = 0;
            for (let r = 1; r <= 2; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.content !== "empty" && t.content !== "path") n++;
            }
            return n >= 12;
          }}
        ]
      },

      // ===== 链尾专用候选 (2026-05-25) — Plan A 5×5 核心 + b2 牺牲外壳 =====

      "plan-a-b2-hybrid": {
        label: "★ 链尾专用 Plan A+b2(chain-end 切换)",
        description: "**Plan A 5×5 核心 + 外层牺牲房满铺**。这是 Python FSM 后新增的 chain-end 专用候选。它成功保留 b2 的链尾防线,但常规 random/weighted 收益没有回来,所以**不是默认解**。\n\n**Python FSM 复测(3 seeds × 8 trials × visits=25/50)**:\n- random/weighted 20.39\n- chain-end **45.69** / chain-end floor **26.68** ✓\n\n若 `analyze_observations.py` 显示 chain-end posterior 高,切这个或 b2 shell;否则保持 Plan A。**不主动通 Atziri**。详 [current-candidates-fsm-compare-plan-a-b2-hybrid.json](results/current-candidates-fsm-compare-plan-a-b2-hybrid.json)。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (function() {
          const entries = [];
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if ((r === 0 && c === 4) || (r === FOYER_TILE.row && c === FOYER_TILE.col)) continue;
              if (r === 0 && c === 0) {
                entries.push({ row: r, col: c, content: "architect_chamber", tier: 0, role: "meta" });
                continue;
              }
              if (3 <= r && r <= 7 && 3 <= c && c <= 7) {
                const kind = ((r + c) % 2 === 0) ? "alchemy_lab" : "thaumaturge";
                const entry = { row: r, col: c, content: kind, tier: kind === "alchemy_lab" ? 3 : 1, role: "core" };
                entries.push(entry);
              } else {
                entries.push({ row: r, col: c, content: "sacrificial_chamber", tier: 1, role: "shell" });
              }
            }
          }
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "hybrid-core", label: "Plan A 5×5 核心已建", check: () => {
            let n = 0;
            for (let r = 3; r <= 7; r++) for (let c = 3; c <= 7; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && (t.content === "alchemy_lab" || t.content === "thaumaturge")) n++;
            }
            return n >= 25;
          }},
          { id: "hybrid-sac-shell", label: "外层牺牲房 ≥ 45 格", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.content === "sacrificial_chamber") n++;
            }
            return n >= 45;
          }}
        ]
      },

      // ===== Plan C (2026-05-19) — Probe 校准开局,0.5 开服当天用 =====

      "probe-calibration": {
        label: "✦ Probe 校准开局(0.5 开服第一天用 · 实测塌陷规则)",
        description: "**0.5 开服当天先用这个**。reach 29,距离梯度 d=1-7,17 named + 9 path + 1 锁牌测试点。跑 3-5 次 close → 记 CSV → 跑 `python sim/analyze_observations.py` → random/weighted 切 Plan A,chain-end 切链尾专用。完整流程见 [FIELD_QUICKSTART.md](results/FIELD_QUICKSTART.md).\n\n**测试点**:(2,4) leaf 锁、(3,4) path cut vertex、(4,4)(7,4) named cut vertex、(4,1)/(4,7) 等 path 命中测试。**不主动通 Atziri**(row 0-1 留空)。",
        exitStrategy: "close",
        rewardSlots: [],
        rewardPriority: [],
        layoutSpec: _buildSpec([
              { row: 2, col: 4, content: "thaumaturge", tier: 1 },
              { row: 3, col: 4, content: "path", tier: 0 },
              { row: 4, col: 2, content: "thaumaturge", tier: 1 },
              { row: 4, col: 3, content: "alchemy_lab", tier: 1 },
              { row: 4, col: 4, content: "thaumaturge", tier: 1 },
              { row: 4, col: 5, content: "alchemy_lab", tier: 1 },
              { row: 4, col: 6, content: "thaumaturge", tier: 1 },
              { row: 5, col: 2, content: "alchemy_lab", tier: 1 },
              { row: 5, col: 3, content: "thaumaturge", tier: 1 },
              { row: 5, col: 4, content: "alchemy_lab", tier: 1 },
              { row: 5, col: 5, content: "thaumaturge", tier: 1 },
              { row: 5, col: 6, content: "alchemy_lab", tier: 1 },
              { row: 6, col: 3, content: "alchemy_lab", tier: 1 },
              { row: 6, col: 4, content: "thaumaturge", tier: 1 },
              { row: 6, col: 5, content: "alchemy_lab", tier: 1 },
              { row: 7, col: 2, content: "alchemy_lab", tier: 1 },
              { row: 7, col: 3, content: "thaumaturge", tier: 1 },
              { row: 7, col: 4, content: "alchemy_lab", tier: 1 },
              { row: 7, col: 5, content: "thaumaturge", tier: 1 },
              { row: 7, col: 6, content: "alchemy_lab", tier: 1 },
              { row: 4, col: 1, content: "path", tier: 0 },
              { row: 4, col: 7, content: "path", tier: 0 },
              { row: 5, col: 1, content: "path", tier: 0 },
              { row: 5, col: 7, content: "path", tier: 0 },
              { row: 6, col: 1, content: "path", tier: 0 },
              { row: 6, col: 7, content: "path", tier: 0 },
              { row: 7, col: 1, content: "path", tier: 0 },
              { row: 7, col: 7, content: "path", tier: 0 },
              { row: 0, col: 0, content: "architect_chamber", tier: 0 }
        ]),
        milestones: [
          { id: "probe-built", label: "Probe 29 格全建", check: () => {
            let placed = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.content !== "empty") placed++;
            }
            return placed >= 28;
          }},
          { id: "observations-20", label: "记录 ≥ 20 塌陷观测", check: () => {
            // 这个里程碑是手动的,UI 不能自动验证 — 玩家自查
            return false;
          }}
        ]
      },

      // ===== 链尾稳健候选 (2026-05-24) — PN 0.5 规则层搜索后新增 =====

      "pn05-chain-safe": {
        label: "★ 链尾稳健候选(chain-end 实测时切)",
        description: "**下移 3×4 收益核心 + 上半全通路缓冲 + 底部/侧边低价房**。这是 2026-05-24 按“0.4 客户端数据 + 0.5 PN 规则层”两阶段搜索找到的新链尾稳健方案。\n\n**严测(10 seeds × 8 trials × visits=25/50)**:\n- random:mean 67.1 / floor 3.9\n- weighted:mean **142.2** / floor **19.7**\n- chain-end:mean **24.8** / floor 4.1\n\n对比旧 Plan B v2b:chain-end mean 12.6 → **24.8**;对比 Plan A:chain-end mean 13.2 → **24.8**。若 Probe/analyze 显示 chain-end posterior 高,切这个。**不主动通 Atziri**。详 [pn05-robust-chain-safe-1774.json](results/pn05-robust-chain-safe-1774.json)。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (function() {
          const entries = [];
          for (let r = 5; r <= 7; r++) {
            for (let c = 3; c <= 6; c++) {
              const kind = ((r + c) % 2 === 0) ? "alchemy_lab" : "thaumaturge";
              const entry = { row: r, col: c, content: kind, tier: 3, role: "core" };
              entries.push(entry);
            }
          }
          for (let r = 1; r <= 4; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              entries.push({ row: r, col: c, content: "path", tier: 0, role: "shell" });
            }
          }
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c === 4) continue;
            entries.push({
              row: 8,
              col: c,
              content: c <= 3 ? ((8 + c) % 2 === 0 ? "garrison" : "armoury") : ((8 + c) % 2 === 0 ? "alchemy_lab" : "thaumaturge"),
              tier: 1,
              role: "shell",
            });
          }
          for (let r = 5; r <= 7; r++) {
            for (const c of [0, 1, 2, 7, 8]) {
              entries.push({
                row: r,
                col: c,
                content: c <= 3 ? ((r + c) % 2 === 0 ? "garrison" : "armoury") : ((r + c) % 2 === 0 ? "alchemy_lab" : "thaumaturge"),
                tier: 1,
                role: "shell",
              });
            }
          }
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0, role: "meta" });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "chain-safe-core", label: "下移 3×4 核心 rows 5-7 cols 3-6", check: () => {
            let n = 0;
            for (let r = 5; r <= 7; r++) for (let c = 3; c <= 6; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && (t.content === "alchemy_lab" || t.content === "thaumaturge") && t.tier >= 3) n++;
            }
            return n >= 10;
          }},
          { id: "chain-safe-path-buffer", label: "上半通路缓冲 ≥ 30 格", check: () => {
            let n = 0;
            for (let r = 1; r <= 4; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.content === "path") n++;
            }
            return n >= 30;
          }}
        ]
      },

      // ===== Plan B (2026-05-19) — 旧 chain-end 备胎,保留作对照 =====

      "core-shell-plan-b": {
        label: "(旧对照) Plan B v2 sac/path 中环",
        description: "**旧 chain-end 备胎 v2,现在保留作对照**。核心 5×5 不变 + 中环 sac/path 棋盘 + 外环全 path。\n\n2026-05-24 PN 规则层复测:random v50 21.0,weighted v50 45.1,chain-end v50 9.7。新“链尾稳健候选”chain-end v50 22.0,已经取代它作为链尾切换方案。**不主动通 Atziri**。详 [pn05-robust-plan-b-v2b.json](results/pn05-robust-plan-b-v2b.json)。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (function() {
          const entries = [];
          // 5×5 核心 rows 3-7 cols 3-7 alchemy/thaum 棋盘 + 3 锁顶层
          for (let r = 3; r <= 7; r++) {
            for (let c = 3; c <= 7; c++) {
              const kind = ((r + c) % 2 === 0) ? "alchemy_lab" : "thaumaturge";
              const tier = (kind === "alchemy_lab") ? 3 : 1;
              const entry = { row: r, col: c, content: kind, tier };
              entries.push(entry);
            }
          }
          // 中环 row 2 + row 8 + col 2 + col 8 用 sac/path 棋盘 (sac 在黑格,path 在白格,确保 sac 之间用 path 串起来连通)
          const inner = [];
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c !== 4) inner.push([2, c]);
            if (c !== 4) inner.push([8, c]);
          }
          for (let r = 3; r <= 7; r++) {
            inner.push([r, 2]);
            inner.push([r, 8]);
          }
          const seen = new Set();
          for (const [r, c] of inner) {
            const key = `${r},${c}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if ((r + c) % 2 === 0) {
              entries.push({ row: r, col: c, content: "sacrificial_chamber", tier: 1 });
            } else {
              entries.push({ row: r, col: c, content: "path", tier: 0 });
            }
          }
          // 外环 rows 0-1 + cols 0-1 全 path (chain-end 杀这些 0 loss),避开 (0,0) architect / (0,4) atziri / foyer
          for (let r = 0; r <= 1; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (r === 0 && c === 0) continue;
              if (r === 0 && c === 4) continue;
              entries.push({ row: r, col: c, content: "path", tier: 0 });
            }
          }
          for (let r = 3; r <= 7; r++) {
            entries.push({ row: r, col: 0, content: "path", tier: 0 });
            entries.push({ row: r, col: 1, content: "path", tier: 0 });
          }
          // Architect
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "core-built", label: "5×5 核心 row 3-7 col 3-7 满铺", check: () => {
            let n = 0;
            for (let r = 3; r <= 7; r++) for (let c = 3; c <= 7; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && (t.content === "alchemy_lab" || t.content === "thaumaturge")) n++;
            }
            return n >= 22;
          }},
          { id: "shell-sac-and-path", label: "中环 sacrificial ≥ 14 + 外环 path ≥ 25", check: () => {
            let sac = 0, path = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (r >= 3 && r <= 7 && c >= 3 && c <= 7) continue;
              const t = state.tiles[r][c];
              if (t.destroyed) continue;
              if (t.content === "sacrificial_chamber") sac++;
              if (t.content === "path") path++;
            }
            return sac >= 14 && path >= 25;
          }}
        ]
      },

      // ===== V3 (2026-05-19) — Baseline 对照,不再主推 =====

      "snake-v3": {
        label: "(baseline) 蛇形主链带锁(8 房主链 + 末端+中段 3 锁 + 左右支链稀释)",
        description: "**0.5 主推**。中列 4 直链 8 个高价值房从入口到顶部。**锁牌位置**:末端 (0,4) + 中段 (4,4) 献祭 + 中段 (3,4) 腐化 = 3 锁。中段其他高价值房是断链关键房(0.5 偶尔降级为通路,接受损失,后续补建)。左右两半填低价值名房作塌陷诱饵(列 0-3 兵营/装备棋盘 + 列 5-8 炼金/放大器棋盘)。建筑师 (0,0) 顶角,密探房 (1,1) 三级持续产纹章。永不通顶部老板。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // 左半 cols 0-3 棋盘(稀释)
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          // 右半 cols 5-8 棋盘(稀释)
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // 主链 col 4 row 0-7 高价值房链(覆盖之前棋盘)
          entries.push({ row: 7, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 6, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 4, col: 4, content: "sacrificial_chamber", tier: 3 });
          entries.push({ row: 3, col: 4, content: "corruption_chamber", tier: 3 });
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "主链通到顶", check: () => atziriReachable() },
          { id: "snake-chain-t3", label: "主链 T3 房 ≥ 3 个", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
              const t = state.tiles[r][4];
              if (!t.destroyed && t.tier >= 3 && t.content !== "path" && t.content !== "empty") n++;
            }
            return n >= 3;
          }},
          { id: "spymaster-t3", label: "密探房三级", check: () => {
            const t = state.tiles[1][1];
            return t.content === "spymaster" && t.tier >= 3 && !t.destroyed;
          }}
        ]
      },

      "snake-v3-no-lock": {
        label: "(baseline) 蛇形主链无锁(8 房主链 + 0 锁牌,纯几何保护)",
        description: "**纹章紧缺方案**。同蛇形主链几何,但**不贴任何锁牌**。靠几何保护:左右支链伸到远端,塌陷优先吃支链末端(0.5 末端塌陷);主链中段是断链关键房,偶尔降级损失加成接受。**适用情况**:纹章池不够维持 3 锁 (产 < 消耗 3)。代价:lootMult 波动比带锁版大。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          entries.push({ row: 7, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 6, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 4, col: 4, content: "sacrificial_chamber", tier: 3 });
          entries.push({ row: 3, col: 4, content: "corruption_chamber", tier: 3 });
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "主链通到顶", check: () => atziriReachable() },
          { id: "no-locks", label: "未消耗锁牌", check: () => {
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].medallion === "juatalotli") return false;
            }
            return true;
          }}
        ]
      },

      "ring-v3": {
        label: "(baseline) 无限循环带锁",
        description: "**最稳布局**。外圈一圈房(顶/底/左/右各一行/列),环上每个房都不是断链关键房,**没有降级风险**。中央 49 格全空,作动态补建区。3 锁贴顶部 (0,2) 铁匠铺 + (0,4) 炼金 + (0,6) 腐化(三个最高加成 HV)。密探房 (1,0) 三级。HV 数量少(只 3 个),但 100% 锁住 → 稳态 lootMult 中等但**波动最小**。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 4, col: 0 }, { row: 4, col: 8 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // row 0
          entries.push({ row: 0, col: 1, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 2, content: "smithy", tier: 3 });
          entries.push({ row: 0, col: 3, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 0, col: 5, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 6, content: "corruption_chamber", tier: 3 });
          entries.push({ row: 0, col: 7, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 8, content: "alchemy_lab", tier: 1 });
          // row 8
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // col 0 row 2-7
          entries.push({ row: 1, col: 0, content: "spymaster", tier: 3 });
          for (let r = 2; r <= 7; r++) entries.push({ row: r, col: 0, content: (r+0)%2===0 ? "garrison" : "armoury", tier: 1 });
          // col 8 row 1-7
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 8, content: (r+8)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // architect
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "顶部可达", check: () => atziriReachable() },
          { id: "ring-hv-3", label: "3 顶部 HV T3 就绪", check: () => {
            let n = 0;
            for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[0][c];
              if (!t.destroyed && t.tier >= 3 && ["smithy", "alchemy_lab", "corruption_chamber"].includes(t.content)) n++;
            }
            return n >= 3;
          }},
          { id: "spymaster-t3", label: "密探房三级", check: () => {
            const t = state.tiles[1][0];
            return t.content === "spymaster" && t.tier >= 3 && !t.destroyed;
          }}
        ]
      },

      "ring-v3-dense": {
        label: "(baseline) 无限循环加强(外圈 + 中心列 4 链 + 3 锁,内部补建区缩小)",
        description: "**ring-v3 改进**(任务 #56)。外圈一圈(30 房)+ 中心列 4 高价值链(7 房 alchemy/thaum/sacrificial/corruption 链),总 37 房。锁:顶端 (0,4) alchemy + 中段 (4,4) sacrificial + (3,4) corruption = 3 锁。中央 col 1-3, 5-7 仍留 36 格空作补建。比 ring-v3 加成更高,但环+链组合让 cut vertex 风险也回来 — 锁牌经济要跟上。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 4, col: 0 }, { row: 4, col: 8 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // 外圈(同 ring-v3)
          entries.push({ row: 0, col: 1, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 2, content: "smithy", tier: 3 });
          entries.push({ row: 0, col: 3, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 5, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 6, content: "corruption_chamber", tier: 3 });
          entries.push({ row: 0, col: 7, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 8, content: "alchemy_lab", tier: 1 });
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          entries.push({ row: 1, col: 0, content: "spymaster", tier: 3 });
          for (let r = 2; r <= 7; r++) entries.push({ row: r, col: 0, content: (r+0)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 8, content: (r+8)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // 中心列 4 高价值链 (1,4) ~ (7,4)
          entries.push({ row: 7, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 6, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 4, col: 4, content: "sacrificial_chamber", tier: 3 });
          entries.push({ row: 3, col: 4, content: "corruption_chamber", tier: 3 });
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 3 });
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 0, col: 4, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "顶部可达", check: () => atziriReachable() },
          { id: "chain-t3", label: "中心链 T3 ≥ 3 格", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
              const t = state.tiles[r][4];
              if (!t.destroyed && t.tier >= 3 && t.content !== "path" && t.content !== "empty") n++;
            }
            return n >= 3;
          }}
        ]
      },

      "sidechain-v3": {
        label: "(baseline) 双侧回旋带锁(左右各短主链 + 中间稀释 + 3 锁)",
        description: "**左右双链,中间充塞**。左侧列 0-1 兵营/装备,(5,1) 铁匠铺三级锁。右侧列 7-8 炼金/放大器,(3,7) 炼金三级锁 + (5,7) 腐化三级锁。中间列 2-6 大量低价值名房 + 必要通路。塌陷会**优先打中部低价值房**(因为中部远离锁牌 + 末端塌陷规则下中部某些格远);**3 个核心 HV 锁住永不动**。主链短(只两侧各 1 个 HV),但加成被锁全保护。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // 左半 cols 0-3 棋盘
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          // 右半 cols 5-8 棋盘
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // 中间 col 4 通路链
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          // 顶部 (0,4) 放大器三级
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          // 核心 HV(0.5 已废锁牌,不贴锁)
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          // architect + spymaster
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "顶部可达", check: () => atziriReachable() },
          { id: "side-hv-3", label: "3 核心 HV T3 就绪", check: () => {
            const coords = [[5,1,"smithy"],[3,7,"alchemy_lab"],[5,7,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "spymaster-t3", label: "密探房三级", check: () => {
            const t = state.tiles[1][1];
            return t.content === "spymaster" && t.tier >= 3 && !t.destroyed;
          }}
        ]
      },

      // ===== V2 (2026-05-19) 历史 reference =====
      "sidelock-locked": {
        label: "★ 侧链稀释带锁(80 房 + 高价值房集中两侧 + 中部低价值稀释 + 3 锁牌)",
        description: "**循环刷神庙策略**。左侧(列 0-1)堆兵营/装备房 + 一个铁匠铺贴锁牌。右侧(列 7-8)堆炼金房/放大器房 + 两个高价值房贴锁牌。中间列 2-6 全用低价值名房当填充,塌陷必然落在这些低价值房上,每次损失小。中间列 4 用炼金/装备交替(8 个名房贡献加成,不浪费成通路)。建筑师固定 (0,0) 顶角,密探房 (1,1) 三级持续掉纹章。**永不通顶部老板**(路虽通但门锁着)。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // 左半 cols 0-3 garrison/armoury 棋盘(稀释房)
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          // 右半 cols 5-8 alchemy/thaum 棋盘(稀释房)
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // col 4 中间链:alchemy/armoury 交替(ADJACENCY 自连)
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 1 });
          entries.push({ row: 2, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 3, col: 4, content: "alchemy_lab", tier: 1 });
          entries.push({ row: 4, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 4, content: "alchemy_lab", tier: 1 });
          entries.push({ row: 6, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 7, col: 4, content: "alchemy_lab", tier: 1 });
          // 顶端 thaum T3
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          // 建筑师顶角
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // 密探 (1,1) T3 持续掉纹章
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          // 核心 HV(0.5 已废锁牌,不贴锁)
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "顶端 thaum 已通", check: () => atziriReachable() },
          { id: "core-hv-3", label: "3 核心 HV T3 就绪", check: () => {
            const coords = [[5,1,"smithy"],[3,7,"alchemy_lab"],[5,7,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "spymaster-t3", label: "密探房 T3 持续掉纹章", check: () => {
            const t = state.tiles[1][1];
            return t.content === "spymaster" && t.tier >= 3 && !t.destroyed;
          }}
        ]
      },
      "ring-locked": {
        label: "★ 环形带锁(32 房 + 外圈一圈 + 中央留空 + 3 锁牌)",
        description: "**最稳布局**。外圈一圈房(顶行底行 + 左列右列),中央 49 格全空。环上每个房都不是断链关键房,塌陷只丢加成不破结构,修复方便。代价:格子用一半左右,总加成比满铺的低。建筑师 (0,0) 顶角,密探房 (1,0)。3 个锁牌贴在顶部炼金房 + 右上腐化房 + 左侧某高价值房。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 4 }, { row: 0, col: 8 },
          { row: 4, col: 0 }, { row: 4, col: 8 },
          { row: 8, col: 0 }, { row: 8, col: 8 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // row 0 顶部:左半 garrison/armoury,中间 alchemy 锁(跨界),右半 alchemy/thaum
          entries.push({ row: 0, col: 1, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 2, content: "smithy", tier: 3 });  // 左上 HV
          entries.push({ row: 0, col: 3, content: "armoury", tier: 1 });
          entries.push({ row: 0, col: 4, content: "alchemy_lab", tier: 3 });  // 跨界 + 顶端 HV
          entries.push({ row: 0, col: 5, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 6, content: "corruption_chamber", tier: 3 });  // 右上 HV
          entries.push({ row: 0, col: 7, content: "thaumaturge", tier: 1 });
          entries.push({ row: 0, col: 8, content: "alchemy_lab", tier: 1 });
          // row 8 底部:foyer 在 (8,4),其余棋盘
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // col 0 左外圈 row 2-7 棋盘 + (1,0) 密探
          entries.push({ row: 1, col: 0, content: "spymaster", tier: 3 });  // 密探 T3
          for (let r = 2; r <= 7; r++) entries.push({ row: r, col: 0, content: (r+0)%2===0 ? "garrison" : "armoury", tier: 1 });
          // col 8 右外圈 row 1-7 棋盘
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 8, content: (r+8)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // 建筑师顶角
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // 中央 row 1-7, col 1-7 全空(不放任何房)
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "顶端可达", check: () => atziriReachable() },
          { id: "top-hv-3", label: "3 顶端 HV T3 就绪", check: () => {
            const coords = [[0,2,"smithy"],[0,4,"alchemy_lab"],[0,6,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "spymaster-t3", label: "密探 T3", check: () => {
            const t = state.tiles[1][0];
            return t.content === "spymaster" && t.tier >= 3 && !t.destroyed;
          }}
        ]
      },
      // ===== 旧 5 模板保留作对比 =====
      "tier-a-nopath-locked": {
        label: "✦ 主推 · 满铺带锁(79 房 + 0 通路 + 3 锁牌 + 建筑师顶角)",
        description: "**满铺策略**。81 格全填名房(除入口和顶部 boss 锚点),没有通路浪费。中列 4 主链:装备→炼金→放大器→献祭→腐化→放大器→炼金→放大器三级(顶)。3 个锁牌贴 (5,1) 铁匠铺、(3,7) 炼金、(5,7) 腐化 — 永久免被塌陷吃。建筑师固定 (0,0) 顶角。供能房放不下(它需要邻接通路,满铺没通路)。**永不打顶部老板**,路通但门锁着。",
        exitStrategy: "close",
        rewardSlots: [
          { row: 0, col: 2 }, { row: 0, col: 6 },
          { row: 2, col: 0 }, { row: 2, col: 8 },
          { row: 6, col: 0 }, { row: 6, col: 8 },
          { row: 8, col: 2 }, { row: 8, col: 6 }
        ],
        rewardPriority: ["kishara_vault", "ancient_reliquary_vault", "currency_vault", "gem_vault", "augment_vault", "tablet_vault", "unique_vault", "sealed_vault"],
        layoutSpec: (() => {
          const entries = [];
          // 左半 cols 0-3 棋盘格
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          // 右半 cols 5-8 棋盘格
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          // row 8 spine(替代原 path):左半 G/A 棋盘格 + 右半 alchemy/thaum 棋盘格,(8,4) 仍 foyer(默认)
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // col 4 主链(替代原 path)— ADJACENCY 互连一直到 atziri
          entries.push({ row: 7, col: 4, content: "armoury", tier: 1 });          // foyer-path 连;(7,3)garrison/(7,5)alchemy 都 ADJACENCY-compat
          entries.push({ row: 6, col: 4, content: "alchemy_lab", tier: 1 });      // armoury-alchemy ✓
          entries.push({ row: 5, col: 4, content: "thaumaturge", tier: 1 });      // alchemy-thaum ✓
          entries.push({ row: 4, col: 4, content: "sacrificial_chamber", tier: 1 }); // thaum-sacrificial ✓
          entries.push({ row: 3, col: 4, content: "corruption_chamber", tier: 1 }); // sacrificial-corruption ✓
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 1 });      // corruption-thaum ✓
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 1 });      // thaum-alchemy ✓
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });      // (0,4) 是可建格(wiki L227 atziri 出格),T3 thaum cap 顶 amp (3,4) corruption + (1,4) alchemy
          // 建筑师顶角(wiki L211 typically far half):(0,0) → architect_chamber(覆盖左半棋盘的 garrison)
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // ⚠️ amplifies 已对调(2026-06-02):Spymaster 现放大实验室组(非 combat)。此 spymaster(1,1) 邻 armoury 的放大协同失效;在此主要为持续掉纹章。模板放大器位置待塌陷算法实测后随布局重审。
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          // HV(0.5 已废锁牌,不贴锁)
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count-70", label: "可达名房 ≥ 70", check: () => {
            const reach = reachableFromFoyer();
            let n = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              const tile = state.tiles[pos.row][pos.col];
              if (tile.destroyed) continue;
              const meta = ROOM_TYPES[tile.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 70;
          }},
          { id: "rarity-hv-3", label: "3 稀有度 HV T3 就绪", check: () => {
            const coords = [[5,1,"smithy"],[3,7,"alchemy_lab"],[5,7,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "no-path", label: "0 path(仅 foyer)", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].content === "path" && !isFoyerTile({row:r,col:c})) n++;
            }
            return n === 0;
          }},
          { id: "architect-corner", label: "建筑师顶角 (0,0)", check: () => state.tiles[0][0].content === "architect_chamber" }
        ]
      },
      "tier-a-nopath-no-lock": {
        label: "⚠ 实验 · 纯房间无锁版(79 房 + 0 J 锁,HV 暴露,非稳定循环)",
        description: "同 tier-a-nopath-locked 几何 + 0 J 锁。**wiki L227 几何修正**:Atziri Chamber 出格,(0,4) 放 thaum T3 cap 顶。建筑师占 (0,0) 顶角。HV(smithy(5,1)、alchemy(5,5)、corruption(5,7))全在 row 5 近 foyer,chain-end-first 算法自然先吃远端。**最干净的纯房间策略**:79 名房全连通,无 path 浪费,无 J 锁消耗。代价:无 Generator(同上)。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          }
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            entries.push({ row: r, col: c, content: (r+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          }
          for (let c = 0; c <= 3; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "garrison" : "armoury", tier: 1 });
          for (let c = 5; c <= 8; c++) entries.push({ row: 8, col: c, content: (8+c)%2===0 ? "alchemy_lab" : "thaumaturge", tier: 1 });
          // col 4 主链
          entries.push({ row: 7, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 6, col: 4, content: "alchemy_lab", tier: 1 });
          entries.push({ row: 5, col: 4, content: "thaumaturge", tier: 1 });
          entries.push({ row: 4, col: 4, content: "sacrificial_chamber", tier: 1 });
          entries.push({ row: 3, col: 4, content: "corruption_chamber", tier: 1 });
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 1 });
          entries.push({ row: 1, col: 4, content: "alchemy_lab", tier: 1 });
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });       // (0,4) 可建格,T3 thaum cap 顶 amp
          // 建筑师顶角(覆盖 garrison)
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // ⚠️ amplifies 已对调(2026-06-02):Spymaster 现放大实验室组;此 spymaster(1,1) 邻 armoury(战斗组)放大协同失效,主要为掉纹章(不锁)
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          // HV 全在 row 5 近 foyer(不锁)
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 5, col: 5, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count-70", label: "可达名房 ≥ 70", check: () => {
            const reach = reachableFromFoyer();
            let n = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              const tile = state.tiles[pos.row][pos.col];
              if (tile.destroyed) continue;
              const meta = ROOM_TYPES[tile.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 70;
          }},
          { id: "no-locks", label: "未消耗 J 锁", check: () => {
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].medallion === "juatalotli") return false;
            }
            return true;
          }},
          { id: "no-path", label: "0 path(仅 foyer)", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].content === "path" && !isFoyerTile({row:r,col:c})) n++;
            }
            return n === 0;
          }},
          { id: "architect-corner", label: "建筑师顶角 (0,0)", check: () => state.tiles[0][0].content === "architect_chamber" }
        ]
      },
      "tier-a-locked": {
        label: "✦ 主推 · 带锁版(64 房 + Spy/Golem 双扩增 + 2 Generator + 3 J 锁 + 建筑师 (0,0))",
        description: "**共享核心**:Spymaster(1,1) T3 + Golem Works(1,5) T3 + 2 Generator (3,5)(5,5) T3 供能。**⚠️ amplifies 已对调(2026-06-02)**:Spymaster 现放大实验室组、Golem Works 现放大战斗组;此布局 Spymaster 邻战斗房、Golem 邻实验室房,两个放大器协同均失效,放大器位置待塌陷算法实测后随布局重审。**wiki L227 几何修正**:Atziri 出格,(0,4) 是可建格 → thaum T3 cap 顶 amp (3,4) corruption。**建筑师固定 (0,0) 顶角**(wiki L211 远端,低价值角落)。**HV 战略位置**:smithy(5,1)、alchemy(3,7)、corruption(5,7)(对调后 smithy 属战斗组归 Golem 放大、alchemy 属实验室组归 Spymaster 放大,但当前放大器距离不到,均未实际放大)。**3 J 锁全套**保证稀有度产出绝对稳。**直链补偿**:col 4 + row 8 path 是 cut vertex,0.5 下塌陷只 downgrade → 主路不断。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            const type = (r + c) % 2 === 0 ? "garrison" : "armoury";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            const type = (r + c) % 2 === 0 ? "alchemy_lab" : "thaumaturge";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          // wiki L227 修正:(0,4) 是可建格,放 thaum T3(覆盖 path entry 顶端)
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          // 建筑师顶角(覆盖左半棋盘 garrison)
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // 共享核心:扩增器 + Generator + HV(0.5 已废锁牌,不贴锁)
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          entries.push({ row: 1, col: 5, content: "golem_works", tier: 3 });
          entries.push({ row: 3, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 5, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count-50", label: "可达名房 ≥ 50", check: () => {
            const reach = reachableFromFoyer();
            let n = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              const tile = state.tiles[pos.row][pos.col];
              if (tile.destroyed) continue;
              const meta = ROOM_TYPES[tile.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 50;
          }},
          { id: "rarity-hv-3", label: "3 稀有度 HV T3 就绪", check: () => {
            const coords = [[5,1,"smithy"],[3,7,"alchemy_lab"],[5,7,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "main-route-immune", label: "主路 col 4 + row 8 全 path(自补偿)", check: () => {
            for (let r = 1; r <= 7; r++) if (state.tiles[r][4].content !== "path") return false;
            return true;
          }}
        ]
      },
      "tier-a-no-lock": {
        label: "⚠ 实验 · 路径无锁版(64 房 + 0 J 锁,HV 暴露,非稳定循环)",
        description: "**共享核心 + 0 J 锁**:Spymaster(1,1)+Golem(1,5)+2 Generator(3,5)(5,5)同 locked 版。**wiki L227 几何修正**:Atziri 出格,(0,4) thaum T3 cap。**建筑师 (0,0) 顶角**。HV 在扩增 range 内(smithy 5,1 / alchemy 3,7 / corruption 5,7)(⚠ amplifies 已对调:Spymaster=实验室/Golem=战斗,协同按新归属算)。**不用任何 J 锁** → 纹章池备用。代价:塌陷可能命中 HV,需手牌补建。**直链补偿同 locked**。适用:纹章紧张时。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            const type = (r + c) % 2 === 0 ? "garrison" : "armoury";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            const type = (r + c) % 2 === 0 ? "alchemy_lab" : "thaumaturge";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          // wiki L227:(0,4) 可建 thaum T3 cap
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          // 建筑师顶角
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // 共享核心:扩增 + Generator(no-lock 版无 J 锁)
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });
          entries.push({ row: 1, col: 5, content: "golem_works", tier: 3 });
          entries.push({ row: 3, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 5, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 5, col: 1, content: "smithy", tier: 3 });
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count-50", label: "可达名房 ≥ 50", check: () => {
            const reach = reachableFromFoyer();
            let n = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              const tile = state.tiles[pos.row][pos.col];
              if (tile.destroyed) continue;
              const meta = ROOM_TYPES[tile.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 50;
          }},
          { id: "hv-near-foyer", label: "3 稀有度 HV 在 rows 5-7", check: () => {
            let n = 0;
            for (let r = 5; r <= 7; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.tier >= 3 && ["smithy", "alchemy_lab", "corruption_chamber"].includes(t.content)) n++;
            }
            return n >= 3;
          }},
          { id: "no-locks", label: "未消耗 J 锁", check: () => {
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].medallion === "juatalotli") return false;
            }
            return true;
          }}
        ]
      },
      "tier-a-best": {
        label: "⚠ 折中实验 · 节约 J(64 房 + 仅 1 J 锁,对比测试中长期最差,不推荐日常)",
        description: "**注意:对比测试发现 1 J 锁稳态分反而不如 3 锁/0 锁**。1 锁让 smithy/alchemy 暴露,被塌陷命中频率高于 J 锁数攒下来的备用价值。此模板**仅作纹章池极度紧张时的折中选项**。**wiki L227 几何修正**:(0,4) thaum T3 cap;**建筑师 (0,0) 顶角**。日常优先用 tier-a-locked(3 锁)或 tier-a-no-lock。**共享核心**:Spymaster(1,1)+Golem(1,5)+2 Generator(3,5)(5,5)+HV 在扩增 range(⚠ amplifies 已对调,协同按新归属算)。仅锁 corruption(5,7)。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          for (let r = 0; r <= 7; r++) for (let c = 0; c <= 3; c++) {
            const type = (r + c) % 2 === 0 ? "garrison" : "armoury";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          for (let r = 0; r <= 7; r++) for (let c = 5; c <= 8; c++) {
            const type = (r + c) % 2 === 0 ? "alchemy_lab" : "thaumaturge";
            entries.push({ row: r, col: c, content: type, tier: 1 });
          }
          // wiki L227:(0,4) 可建 thaum T3 cap
          entries.push({ row: 0, col: 4, content: "thaumaturge", tier: 3 });
          // 建筑师顶角
          entries.push({ row: 0, col: 0, content: "architect_chamber", tier: 0 });
          // 战略 HV + 扩增
          entries.push({ row: 1, col: 1, content: "spymaster", tier: 3 });  // ⚠️ amplifies 对调后 spymaster 放大实验室组,邻 armoury 放大协同失效;此处主要掉纹章(放大器位置待重审)
          entries.push({ row: 1, col: 5, content: "golem_works", tier: 3 });  // 邻居 (1,6)thaum 不在 golem 升级源(golem 无邻接升级,powerTier=Generator);(2,5)alchemy 不连;但 ADJACENCY 角度 golem-thaum 不连,golem 只连 smithy. (1,5) 实际只能连 (1,4)path → OK reachable
          entries.push({ row: 3, col: 5, content: "generator", tier: 3 });  // 邻居 (3,4)path,(3,6)thaum ✓(generator-thaum),(2,5)alchemy 不连,(4,5)alchemy 不连. → 1 个 ADJACENCY 连接 via thaum + path
          entries.push({ row: 5, col: 5, content: "generator", tier: 3 });  // 同上,通过 thaum/path 连
          entries.push({ row: 3, col: 1, content: "smithy", tier: 3 });  // 邻居 (3,0)armoury ✓(smithy-armoury),(3,2)armoury ✓,(2,1)armoury ✓,(4,1)armoury ✓
          entries.push({ row: 3, col: 7, content: "alchemy_lab", tier: 3 });  // 已有 alchemy,只是 tier 3
          entries.push({ row: 5, col: 7, content: "corruption_chamber", tier: 3 });  // 邻居全 thaum ✓(0.5 已废锁牌)
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count-50", label: "可达名房 ≥ 50", check: () => {
            const reach = reachableFromFoyer();
            let n = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              const tile = state.tiles[pos.row][pos.col];
              if (tile.destroyed) continue;
              const meta = ROOM_TYPES[tile.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 50;
          }},
          { id: "amp-active", label: "Spymaster + Golem Works 双扩增就绪", check: () => {
            let spy = false, golem = false;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (t.destroyed) continue;
              if (t.content === "spymaster" && t.tier === 3) spy = true;
              if (t.content === "golem_works" && t.tier === 3) golem = true;
            }
            return spy && golem;
          }},
          { id: "corruption-t3", label: "corruption_chamber (5,7) T3 就绪", check: () => {
            const t = state.tiles[5][7];
            return !t.destroyed && t.content === "corruption_chamber" && t.tier >= 3;
          }}
        ]
      },
      // ===== 旧模板保留为参考(测试 + 历史 reference)— UI 下拉里折叠在主推下方 =====
      "multi-chain-j-lock": {
        label: "多链稀释 + 锁定纹章锁 3 个高价值房(算法无关稳健)",
        description: "主链第 4 列 + 4 条横向支链 + 铁匠铺/密探/发电机 三阶 + 3 张锁定纹章。无论塌陷选目标是末端优先还是均匀随机,都能保住 3 个高价值房。需要 3 张锁定纹章。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 主链 col 4 全 path
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          // 4 横支 row 0/2/4/6 path
          for (const r of [0, 2, 4, 6]) {
            for (let c = 0; c < 9; c++) {
              if (c === 4) continue;
              entries.push({ row: r, col: c, content: "path", tier: 0 });
            }
          }
          // atziri
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // 3 HV(0.5 已废锁牌,不贴锁)
          entries.push({ row: 7, col: 4, content: "smithy", tier: 3 });
          entries.push({ row: 5, col: 4, content: "spymaster", tier: 3 });
          entries.push({ row: 3, col: 4, content: "generator", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "reach", label: "可达格 ≥ 35(基础铺垫)", check: () => reachableFromFoyer().size >= 35 },
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "hv", label: "3 个高价值房三阶全到位", check: () => {
            const need = ["smithy", "spymaster", "generator"];
            return need.every(t => {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content === t && tile.tier === 3 && !tile.destroyed) return true;
              }
              return false;
            });
          }}
        ]
      },
      "snake-classic": {
        label: "经典直链(8 房主链,靠诱饵壳吸塌陷)",
        description: "传统蛇形,第 4 列单链 + 3 个高价值房(铁匠铺 / 密探 / 发电机 三阶)。0.5 锁牌已废,改靠远端诱饵壳吸塌陷保护 HV。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          entries.push({ row: 7, col: 4, content: "smithy", tier: 3 });
          entries.push({ row: 5, col: 4, content: "spymaster", tier: 3 });
          entries.push({ row: 3, col: 4, content: "generator", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "hv", label: "3 个高价值房三阶全到位", check: () => {
            const need = ["smithy", "spymaster", "generator"];
            return need.every(t => {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content === t && tile.tier === 3 && !tile.destroyed) return true;
              }
              return false;
            });
          }}
        ]
      },
      "sacrifice-limb": {
        label: "牺牲支链 + 通路修复(假设末端优先塌陷)",
        description: "主链 + 8 格牺牲支链,所有塌陷打在支链上,主链 0 命中。塌陷选末端优先时完美;均匀随机时效果折半。不需要纹章。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          entries.push({ row: 7, col: 4, content: "smithy", tier: 3 });
          entries.push({ row: 5, col: 4, content: "spymaster", tier: 3 });
          entries.push({ row: 3, col: 4, content: "generator", tier: 3 });
          const limbCols = [5, 6, 7, 8];
          for (const c of limbCols) entries.push({ row: 4, col: c, content: "path", tier: 0 });
          for (const r of [3, 2, 5, 6]) entries.push({ row: r, col: 8, content: "path", tier: 0 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "hv", label: "3 个高价值房三阶全到位", check: () => {
            const need = ["smithy", "spymaster", "generator"];
            return need.every(t => {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content === t && tile.tier === 3 && !tile.destroyed) return true;
              }
              return false;
            });
          }},
          { id: "limb-buffer", label: "支链缓冲格 ≥ 8 格", check: () => computeLimbBuffer().buffer >= 8 }
        ]
      },
      "ring-loop": {
        label: "环形闭环(0.5 抗塌陷新思路 · 推荐)",
        description: "主链第 4 列通到阿兹里 + 左右双链(第 3 / 5 列)在顶部 (1,3 / 1,4 / 1,5) 闭环。高价值房放在环上 — 不是断链关键点,0.5 塌陷只会移除留空格(下次进神庙补卡),不会降级为死通路。多回合循环友好。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 主链 col 4(rows 1-7 全 path,顶部 (1,4) 是环的「桥」)
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          // atziri 接在 (0,4)
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // 底部分叉:(8,3) (8,5) 给 foyer 加一条平行连通,让 (7,4) 也不再是 cut vertex
          entries.push({ row: 8, col: 3, content: "path", tier: 0 });
          entries.push({ row: 8, col: 5, content: "path", tier: 0 });
          // 左侧链 col 3:rows 1-8 全 path
          for (let r = 1; r <= 8; r++) {
            if (r === 8) continue;  // (8,3) 已加
            entries.push({ row: r, col: 3, content: "path", tier: 0 });
          }
          // 右侧链 col 5:rows 1-8 全 path
          for (let r = 1; r <= 8; r++) {
            if (r === 8) continue;
            entries.push({ row: r, col: 5, content: "path", tier: 0 });
          }
          // 顶部连接:(1,3) (1,4) (1,5) 都是 path 形成环顶
          // (1,3) 和 (1,5) 已经在 col 3 / col 5 链里
          // 3 HV 房在环上 — 都不是 cut vertex
          entries.push({ row: 5, col: 3, content: "spymaster", tier: 3 });
          entries.push({ row: 5, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 3, col: 4, content: "smithy", tier: 3 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "ring-closed", label: "闭环形成(无断链关键点)", check: () => {
            const reach = reachableFromFoyer();
            // 检查除 foyer 之外是否所有可达格子都不是 cut vertex
            let cutCount = 0;
            for (const key of reach) {
              const pos = parseKey(key);
              if (isFoyerTile(pos)) continue;
              if (wouldDisconnect(pos, reach)) cutCount++;
            }
            return cutCount === 0 && reach.size >= 15;
          }},
          { id: "hv", label: "3 个高价值房三阶全到位", check: () => {
            const need = ["smithy", "spymaster", "generator"];
            return need.every(t => {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content === t && tile.tier === 3 && !tile.destroyed) return true;
              }
              return false;
            });
          }},
          { id: "hv-on-ring", label: "高价值房都在环上(非断链关键点)", check: () => {
            const reach = reachableFromFoyer();
            const need = ["smithy", "spymaster", "generator"];
            for (const t of need) {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content !== t || tile.destroyed) continue;
                if (!reach.has(tileKey({row: r, col: c}))) return false;
                if (wouldDisconnect({row: r, col: c}, reach)) return false;
              }
            }
            return true;
          }}
        ]
      },
      "ring-limb-hybrid": {
        label: "环 + 牺牲支链(0.5 最强 · 修复友好)",
        description: "环形主链(高价值房放在环上,免疫降级)+ 西向 8 格牺牲支链(吸 chain-end-first 塌陷)+ 每回合用通路卡修复支链。环保 HV、支链当肉盾、修复维持稳态——多回合循环下最强的 0.5 抗塌陷形态。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 环主体(同 ring-loop):col 3/4/5 行 1-7 path + 底部 (8,3)(8,5) + 顶部环口
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          entries.push({ row: 8, col: 3, content: "path", tier: 0 });
          entries.push({ row: 8, col: 5, content: "path", tier: 0 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 3, content: "path", tier: 0 });
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 5, content: "path", tier: 0 });
          // 3 HV 房在环上(非断链关键点 → 0.5 下免疫降级)
          // ⚠️ amplifies 已对调(2026-06-02):Spymaster 现放大实验室组(非 combat)。原"Smithy 享 spymaster放大+generator供能双buff"失效(Smithy 是 combat,现归 Golem Works 放大);Smithy(3,4) 现仅 generator 供能。放大器位置待塌陷算法实测后随布局重审。Generator (5,5) 供能 Smithy(md=3 在 T1 range 内)仍有效。
          entries.push({ row: 5, col: 3, content: "spymaster", tier: 3 });
          entries.push({ row: 5, col: 5, content: "generator", tier: 3 });
          entries.push({ row: 3, col: 4, content: "smithy", tier: 3 });
          // 西向牺牲支链(8 格)— 远离 foyer 让支链末端是 chain-end-first 的优先目标
          // (4,2)(4,1)(4,0) → 横向 3 格 + (3,0)(2,0)(5,0)(6,0)(7,0) → 纵向 5 格 = 8 格
          entries.push({ row: 4, col: 2, content: "path", tier: 0 });
          entries.push({ row: 4, col: 1, content: "path", tier: 0 });
          entries.push({ row: 4, col: 0, content: "path", tier: 0 });
          entries.push({ row: 3, col: 0, content: "path", tier: 0 });
          entries.push({ row: 2, col: 0, content: "path", tier: 0 });
          entries.push({ row: 5, col: 0, content: "path", tier: 0 });
          entries.push({ row: 6, col: 0, content: "path", tier: 0 });
          entries.push({ row: 7, col: 0, content: "path", tier: 0 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "ring-closed", label: "环闭合(cutCount ≤ 4)", check: () => {
            const ring = computeRingHealth();
            return ring.cutCount <= 4 && ring.reachableTiles >= 20;
          }},
          { id: "hv-on-ring", label: "3 个 HV 房都在环上(免降级)", check: () => {
            const ring = computeRingHealth();
            return ring.hvOnRing >= 3;
          }},
          { id: "hv", label: "3 个高价值房三阶全到位", check: () => {
            const need = ["smithy", "spymaster", "generator"];
            return need.every(t => {
              for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
                const tile = state.tiles[r][c];
                if (tile.content === t && tile.tier === 3 && !tile.destroyed) return true;
              }
              return false;
            });
          }},
          { id: "limb-buffer", label: "支链缓冲格 ≥ 8 格", check: () => computeLimbBuffer().buffer >= 8 }
        ]
      },
      "side-chain-path-dilute": {
        label: "侧链 HV + 中部纯通路稀释(用户原始字面版)",
        description: "你原话的字面版:col 0 主 HV 链(smithy/alchemy/corruption + J 锁),col 2/4/6/8 全是 path 链(通路卡稀释)。代价:中部 path 不出 mod(只稀释)。优点:通路卡便宜,塌陷后补建快。**1/N 数学**:在 9x9 网格里实际只能做到 col 0/col 8 端点并列最远 → 1/2 分摊,不是严格 1/5(几何限制)。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // row 8 spine
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          // col 4 主路通 atziri
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // col 0 主 HV 链(稀有度焦点,0.5 已废锁牌)
          entries.push({ row: 7, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 0, content: "smithy", tier: 3 });
          entries.push({ row: 4, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 3, col: 0, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 2, col: 0, content: "thaumaturge", tier: 1 });
          entries.push({ row: 1, col: 0, content: "corruption_chamber", tier: 3 });
          // col 2/6/8 纯通路稀释链
          for (const c of [2, 6, 8]) {
            for (let r = 1; r <= 7; r++) entries.push({ row: r, col: c, content: "path", tier: 0 });
          }
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "main-hv-3", label: "主链 3 稀有度 HV T3 就绪", check: () => {
            const coords = [[5,0,"smithy"],[3,0,"alchemy_lab"],[1,0,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "path-dilution", label: "3 条 path 稀释链(各 ≥ 5 格)", check: () => {
            let chains = 0;
            for (const c of [2, 6, 8]) {
              let cnt = 0;
              for (let r = 1; r <= 7; r++) {
                const t = state.tiles[r][c];
                if (!t.destroyed && t.content === "path") cnt++;
              }
              if (cnt >= 5) chains++;
            }
            return chains >= 3;
          }}
        ]
      },
      "dilute-no-lock": {
        label: "纯稀释,不锁房(用户「不锁房」版)",
        description: "你另一种解读:完全不用 J 锁,靠 N 条等长稀释链 + 多余资源做稀释。col 4 主路 + col 0/2/6/8 都是 garrison-commander 交替的低价值房链。稀有度焦点房(smithy/alchemy/corruption)放靠近 foyer(rows 5-7)自然受 chain-end-first 算法保护。代价:稀有度 HV 没 J 锁,运气不好被吃就要补建。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // row 8 spine
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          // col 4 主路通 atziri
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // col 0/2/6/8 链:稀有度焦点房放近 foyer(rows 5-7),远端 rows 1-4 是 junk
          // col 0
          entries.push({ row: 7, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 0, content: "smithy", tier: 3 });  // 稀有度 HV 不锁 — 近 foyer 自然保护
          entries.push({ row: 4, col: 0, content: "commander", tier: 1 });
          entries.push({ row: 3, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 2, col: 0, content: "commander", tier: 1 });
          entries.push({ row: 1, col: 0, content: "garrison", tier: 1 });
          // col 2:近 foyer 稀有度,远端 junk
          entries.push({ row: 7, col: 2, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 2, content: "thaumaturge", tier: 1 });
          entries.push({ row: 5, col: 2, content: "alchemy_lab", tier: 3 });  // 稀有度 HV 不锁
          entries.push({ row: 4, col: 2, content: "garrison", tier: 1 });
          entries.push({ row: 3, col: 2, content: "commander", tier: 1 });
          entries.push({ row: 2, col: 2, content: "garrison", tier: 1 });
          entries.push({ row: 1, col: 2, content: "commander", tier: 1 });
          // col 6:近 foyer 稀有度
          entries.push({ row: 7, col: 6, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 6, content: "thaumaturge", tier: 1 });
          entries.push({ row: 5, col: 6, content: "corruption_chamber", tier: 3 });  // 稀有度 HV 不锁
          entries.push({ row: 4, col: 6, content: "garrison", tier: 1 });
          entries.push({ row: 3, col: 6, content: "commander", tier: 1 });
          entries.push({ row: 2, col: 6, content: "garrison", tier: 1 });
          entries.push({ row: 1, col: 6, content: "commander", tier: 1 });
          // col 8 全 junk
          for (let r = 1; r <= 7; r++) {
            entries.push({ row: r, col: 8, content: r % 2 === 0 ? "commander" : "garrison", tier: 1 });
          }
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "hv-near-foyer", label: "3 稀有度 HV 都在 rows 5-7 近 foyer", check: () => {
            let n = 0;
            for (let r = 5; r <= 7; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.tier >= 3 && ["smithy", "alchemy_lab", "corruption_chamber"].includes(t.content)) n++;
            }
            return n >= 3;
          }},
          { id: "no-locks", label: "完全不消耗锁定纹章", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].medallion === "juatalotli") n++;
            }
            return n === 0;
          }},
          { id: "dilution-chains", label: "≥ 4 条稀释链(各 ≥ 5 房)", check: () => {
            let chains = 0;
            for (const c of [0, 2, 6, 8]) {
              let cnt = 0;
              for (let r = 1; r <= 7; r++) {
                const t = state.tiles[r][c];
                if (!t.destroyed && t.content !== "empty" && t.content !== "path") cnt++;
              }
              if (cnt >= 5) chains++;
            }
            return chains >= 4;
          }}
        ]
      },
      "side-chain-with-dilution": {
        label: "侧链 HV + 中部房间稀释(原策略升级版 · mod stack 优化)",
        description: "你策略的房间升级版:中部稀释链用 garrison-commander 交替低价值房代替通路(2 章自动升 T2,既稀释又出 mod)。col 0 主 HV 链 J 锁稀有度。**1/N 数学诚实说明**:9x9 网格几何限制,5 条链端点距 foyer 不全相同(col 0/8 距离 11,col 2/6 距离 9,col 4 距离 7)→ 实际只在 col 0/8 端点 1/2 分摊。col 0 主链由 J 锁保护;真正吸塌陷的是 col 8(同距离无锁)。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 主轴 col 4 通 atziri
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // row 8 spine 连各链 base 到 foyer
          for (let c = 0; c <= 8; c++) {
            if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          }
          // col 0 主 HV 链:稀有度焦点房(0.5 已废锁牌,不贴锁)
          entries.push({ row: 7, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 0, content: "smithy", tier: 3 });
          entries.push({ row: 4, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 3, col: 0, content: "alchemy_lab", tier: 3 });
          entries.push({ row: 2, col: 0, content: "thaumaturge", tier: 1 });
          entries.push({ row: 1, col: 0, content: "corruption_chamber", tier: 3 });
          // 稀释链 col 2 / 6 / 8: Garrison-Commander 交替(自动升 T2)
          for (const c of [2, 6, 8]) {
            entries.push({ row: 7, col: c, content: "garrison", tier: 1 });
            entries.push({ row: 6, col: c, content: "commander", tier: 1 });
            entries.push({ row: 5, col: c, content: "garrison", tier: 1 });
            entries.push({ row: 4, col: c, content: "commander", tier: 1 });
            entries.push({ row: 3, col: c, content: "garrison", tier: 1 });
            entries.push({ row: 2, col: c, content: "commander", tier: 1 });
            entries.push({ row: 1, col: c, content: "garrison", tier: 1 });
          }
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "main-hv-3", label: "主链 3 稀有度 HV T3 就绪", check: () => {
            const coords = [[5,0,"smithy"],[3,0,"alchemy_lab"],[1,0,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "dilution-chains", label: "≥ 3 条稀释链(各 ≥ 5 房)", check: () => {
            let chains = 0;
            for (const c of [2, 6, 8]) {
              let cnt = 0;
              for (let r = 1; r <= 7; r++) {
                const t = state.tiles[r][c];
                if (!t.destroyed && (t.content === "garrison" || t.content === "commander")) cnt++;
              }
              if (cnt >= 5) chains++;
            }
            return chains >= 3;
          }}
        ]
      },
      "perimeter-ring-dense": {
        label: "外环密铺(无中央 · 截图实战版)",
        description: "wiki 互动图 + 你截图的实战形态:外圈密铺名房,中央完全空。30+ 房,几乎无 path。J 锁稀有度房(smithy/alchemy/corruption)防关键收益丢失。塌陷打非断链房=移除留空格,下次手牌补回来。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 外圈 row 0/8 + col 0/8
          // row 8 spine(连 foyer)— 全 path 防 spymaster-commander chain 限制
          for (let c = 0; c <= 8; c++) if (c !== 4) entries.push({ row: 8, col: c, content: "path", tier: 0 });
          // col 0 左边外圈
          entries.push({ row: 7, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 0, content: "smithy", tier: 3 });  // HV(0.5 已废锁牌)
          entries.push({ row: 4, col: 0, content: "armoury", tier: 1 });
          entries.push({ row: 3, col: 0, content: "alchemy_lab", tier: 3 });  // HV
          entries.push({ row: 2, col: 0, content: "thaumaturge", tier: 1 });
          entries.push({ row: 1, col: 0, content: "corruption_chamber", tier: 3 });  // HV
          // row 0 顶部外圈
          entries.push({ row: 0, col: 0, content: "garrison", tier: 1 });
          entries.push({ row: 0, col: 1, content: "commander", tier: 1 });
          entries.push({ row: 0, col: 2, content: "garrison", tier: 1 });
          entries.push({ row: 0, col: 3, content: "path", tier: 0 });  // 接 atziri 的桥
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          entries.push({ row: 0, col: 5, content: "path", tier: 0 });
          entries.push({ row: 0, col: 6, content: "garrison", tier: 1 });
          entries.push({ row: 0, col: 7, content: "commander", tier: 1 });
          entries.push({ row: 0, col: 8, content: "garrison", tier: 1 });
          // col 8 右边外圈
          entries.push({ row: 1, col: 8, content: "armoury", tier: 1 });
          entries.push({ row: 2, col: 8, content: "smithy", tier: 1 });
          entries.push({ row: 3, col: 8, content: "golem_works", tier: 1 });
          entries.push({ row: 4, col: 8, content: "smithy", tier: 1 });
          entries.push({ row: 5, col: 8, content: "armoury", tier: 1 });
          entries.push({ row: 6, col: 8, content: "garrison", tier: 1 });
          entries.push({ row: 7, col: 8, content: "commander", tier: 1 });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "rarity-hv-3", label: "3 稀有度 HV T3 就绪", check: () => {
            const coords = [[5,0,"smithy"],[3,0,"alchemy_lab"],[1,0,"corruption_chamber"]];
            return coords.every(([r,c,ct]) => {
              const t = state.tiles[r][c];
              return !t.destroyed && t.content === ct && t.tier >= 3;
            });
          }},
          { id: "hollow-center", label: "中央 (3-5, 3-5) 9 格全空", check: () => {
            for (let r = 3; r <= 5; r++) for (let c = 3; c <= 5; c++) {
              if (state.tiles[r][c].content !== "empty") return false;
            }
            return true;
          }},
          { id: "perimeter-density", label: "外圈 ≥ 18 个名房", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const onPerimeter = r === 0 || r === 8 || c === 0 || c === 8;
              if (!onPerimeter) continue;
              const t = state.tiles[r][c];
              const meta = ROOM_TYPES[t.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 18;
          }}
        ]
      },
      "hv-near-foyer-ring": {
        label: "HV 近 foyer + 远端垃圾(无需 J 锁)",
        description: "环形布局 + HV 集中在 foyer 这半圈(距 foyer 近)、垃圾房在 atziri 那半圈(距 foyer 远)。chain-end-first 自然先吃 atziri 端(垃圾),HV 不需要 J 锁。代价:HV 都挤在底部 → 上去 atziri 的路全是垃圾房。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 主轴 col 4 上半段垃圾 + 下半段 HV
          for (let r = 1; r <= 3; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });  // 远端 path
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          // 下半段 HV(rows 4-7,col 4 同 + col 3/5 围 foyer)
          entries.push({ row: 7, col: 4, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 4, content: "armoury", tier: 1 });
          entries.push({ row: 5, col: 4, content: "smithy", tier: 3 });  // 近 foyer,不锁
          entries.push({ row: 4, col: 4, content: "golem_works", tier: 1 });
          // 左下集群
          entries.push({ row: 7, col: 3, content: "commander", tier: 1 });
          entries.push({ row: 6, col: 3, content: "alchemy_lab", tier: 3 });  // HV 不锁
          entries.push({ row: 5, col: 3, content: "thaumaturge", tier: 1 });
          // 右下集群
          entries.push({ row: 7, col: 5, content: "spymaster", tier: 1 });  // 注意 commander 已在 (7,3),spymaster 不能在同链!
          // commander 在 (7,3),garrison 在 (7,4),spymaster 在 (7,5) — 是否同链?
          // canPlaceRoom 会查 — spymaster 不能与 commander 同链(链中含 commander)
          // 因为 (7,4) garrison 邻接 (7,3) commander 和 (7,5) spymaster,它们通过 garrison 互连接 → 同一连通分量 → spymaster 放不了
          // 把 spymaster 改为 synthflesh_lab(转换 garrison(7,4) 为 transcendent T2 — 也是 HV)
          entries[entries.length - 1] = { row: 7, col: 5, content: "synthflesh_lab", tier: 1 };
          entries.push({ row: 6, col: 5, content: "flesh_surgeon", tier: 1 });
          entries.push({ row: 5, col: 5, content: "corruption_chamber", tier: 3 });  // HV 不锁
          // 远端 path 链通 atziri
          // (3,4) -> (2,4) -> (1,4) -> (0,4) atziri
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "hv-bottom", label: "3 稀有度 HV 都在 rows 5-7", check: () => {
            let n = 0;
            for (let r = 5; r <= 7; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t.destroyed && t.tier >= 3 && ["smithy", "alchemy_lab", "corruption_chamber"].includes(t.content)) n++;
            }
            return n >= 3;
          }},
          { id: "no-medallions-used", label: "未消耗锁定纹章", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              if (state.tiles[r][c].medallion === "juatalotli") n++;
            }
            return n === 0;
          }}
        ]
      },
      "room-dense": {
        label: "房间堆叠(最大化 mod stack)",
        description: "wiki line 1036 + 互动图证实:互动房邻接自动连通,不需 path。本布局除 foyer 外几乎无 path,17 格全堆 mod 房,mod stack 最大化 → 单次进庙收益顶上限。代价:塌陷会去掉非断链 HV(0.5 下变空格,下次能补卡);配合纹章锁 + 多 Generator 供能效果更好。",
        exitStrategy: "close",
        layoutSpec: (() => {
          const entries = [];
          // 主轴 col 4:foyer → ... → atziri(全用房间互动连通,无 path)
          // garrison-armoury(✓ 升级互联)
          entries.push({ row: 7, col: 4, content: "garrison", tier: 1 });
          entries.push({ row: 6, col: 4, content: "flesh_surgeon", tier: 1 });    // garrison-flesh_surgeon ✓
          entries.push({ row: 5, col: 4, content: "synthflesh_lab", tier: 1 });   // flesh_surgeon-synthflesh ✓
          entries.push({ row: 4, col: 4, content: "armoury", tier: 1 });          // synthflesh-armoury ✓
          entries.push({ row: 3, col: 4, content: "alchemy_lab", tier: 1 });      // armoury-alchemy ✓
          entries.push({ row: 2, col: 4, content: "thaumaturge", tier: 1 });      // alchemy-thaum ✓
          entries.push({ row: 1, col: 4, content: "sacrificial_chamber", tier: 1 }); // thaum-sacrificial ✓
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });   // sacrificial-atziri(atziri 连任意)✓
          // 侧扩 col 3 / col 5:加更多互动房
          entries.push({ row: 7, col: 3, content: "commander", tier: 1 });        // garrison-commander ✓
          entries.push({ row: 7, col: 5, content: "armoury", tier: 1 });          // garrison-armoury ✓(另一个 armoury)
          entries.push({ row: 6, col: 3, content: "garrison", tier: 1 });         // commander-garrison ✓
          entries.push({ row: 6, col: 5, content: "smithy", tier: 1 });           // armoury-smithy ✓
          entries.push({ row: 5, col: 3, content: "synthflesh_lab", tier: 1 });   // garrison-synthflesh ✓(可能转换 (6,3) → transcendent)
          entries.push({ row: 5, col: 5, content: "golem_works", tier: 1 });      // smithy-golem ✓
          entries.push({ row: 4, col: 3, content: "smithy", tier: 1 });           // armoury-smithy ✓(对面)
          entries.push({ row: 4, col: 5, content: "smithy", tier: 1 });           // armoury-smithy ✓
          entries.push({ row: 3, col: 3, content: "golem_works", tier: 1 });      // smithy-golem ✓
          entries.push({ row: 3, col: 5, content: "golem_works", tier: 1 });      // smithy-golem ✓
          entries.push({ row: 2, col: 3, content: "generator", tier: 1 });        // thaum-generator ✓
          entries.push({ row: 2, col: 5, content: "generator", tier: 1 });        // thaum-generator ✓(双供能)
          entries.push({ row: 1, col: 3, content: "corruption_chamber", tier: 1 }); // sacrificial-corruption ✓
          entries.push({ row: 1, col: 5, content: "corruption_chamber", tier: 1 }); // sacrificial-corruption ✓
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "room-count", label: "mod 房 ≥ 16 个", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (!t || t.destroyed) continue;
              const meta = ROOM_TYPES[t.content];
              if (meta?.modBonus?.length) n++;
            }
            return n >= 16;
          }},
          { id: "low-path", label: "path 格 ≤ 1(只 foyer)", check: () => {
            let n = 0;
            for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
              const t = state.tiles[r][c];
              if (t.content === "path" && !t.destroyed && !isFoyerTile({row:r,col:c})) n++;
            }
            return n <= 1;
          }},
          { id: "lootMult-high", label: "lootMult ≥ 5×(高 mod stack)", check: () => totalScore().lootMult >= 5 }
        ]
      },
      "reward-stack": {
        label: "奖励房堆叠(建筑师击杀 × N · 0.5 待重估)",
        description: "每次进神庙杀建筑师 → 在控制台放奖励房。0.5 PN 后可达控制台房关庙必结算,此模板只保留为历史/暂存对照,不再作为长期核心。",
        exitStrategy: "architect",
        layoutSpec: (() => {
          const entries = [];
          for (let r = 1; r <= 7; r++) entries.push({ row: r, col: 4, content: "path", tier: 0 });
          // path 行 4/6 横向铺路供 reward room 连通
          for (const r of [4, 6]) {
            for (const c of [3, 5]) entries.push({ row: r, col: c, content: "path", tier: 0 });
          }
          entries.push({ row: 0, col: 4, content: "atziri_chamber", tier: 0 });
          entries.push({ row: 7, col: 4, content: "smithy", tier: 3 });
          entries.push({ row: 5, col: 4, content: "spymaster", tier: 3 });
          entries.push({ row: 3, col: 4, content: "generator", tier: 3 });
          // reward rooms(后写覆盖上面 path)
          entries.push({ row: 4, col: 3, content: "kishara_vault", tier: 1, rewardLocked: true });
          entries.push({ row: 4, col: 5, content: "jiquani_vault", tier: 1, rewardLocked: true });
          entries.push({ row: 6, col: 3, content: "currency_vault", tier: 1, rewardLocked: true });
          entries.push({ row: 6, col: 5, content: "unique_vault", tier: 1, rewardLocked: true });
          entries.push({ row: 2, col: 5, content: "tablet_vault", tier: 1, rewardLocked: true });
          return _buildSpec(entries);
        })(),
        milestones: [
          { id: "atziri", label: "阿兹里路线已通", check: () => atziriReachable() },
          { id: "rewards", label: "≥ 3 张控制台奖励房暂存", check: () => countRewardLocked() >= 3 },
          { id: "full-rewards", label: "≥ 5 张控制台奖励房暂存", check: () => countRewardLocked() >= 5 }
        ]
      }
    };

    // 当前状态距 target 的 gap — 返回需要的动作列表
