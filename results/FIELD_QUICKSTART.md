# 0.5 开服速查卡 — 校准当天用

**目标**:5 次 close 内确定塌陷算法,直接切到正确主推。

---

## 步骤(开服当天 30 分钟)

### 1. 选模板:✦ Probe 校准开局
UI 下拉第一个,29 格,带 1 张锁。

### 2. 进游戏照模板搭出
锁牌贴在 **(2,4)** thaumaturge(leaf 房 + 高距离测试点)。

### 3. 每次 close 前
记下 `reach_before`(可达房间数,UI 顶部能看到)。

### 4. close 后,逐个塌陷格生成一行
在 UI 的“开服校准 → 生成观测行”里:

1. 点中间棋盘上被塌陷的格子
2. 填 visit / 事件 / 结果 / 备注
3. 点“把选中格加入观测”
4. 用“复制 CSV”或“下载 CSV”保存为 `results/field-observation.csv`

工具会自动填 row/col、reach_before、distance、content、tier、is_path、is_cut_vertex、has_lock。你也可以手动编辑 CSV:

```
visit, rule_event, reach_before, target_row, target_col, distance_from_foyer, content, tier, is_path, is_cut_vertex, has_lock, result, notes
2, close, 27, 1, 7, 8, path, 0, true, false, false, remove, 
```

**字段速查**:
- `distance_from_foyer`:foyer (8,4) = 0,数 BFS 距离
- `is_cut_vertex`:移除该格会断别的格的连通 → true
- `has_lock`:该格此 visit 开始时贴了锁牌 → true
- `result`:`remove`(destroy) / `downgrade`(content→path) / `skip`(锁挡住或 cut-vertex 跳过)

### 5. 第 4-5 次 close 后跑判定

```bash
python sim/analyze_observations.py
```

### 6. 回 UI 读取结果并切模板

在“开服校准”页点“读取校准结果”,UI 会读取 `results/calibration-summary.json` 并给出加载按钮。

脚本里的 recommendation 字段含义:

| recommendation 字段 | 动作 |
|---|---|
| `PENDING: 还差 N 个观测` | 继续 close + 记录 |
| `AMBIGUOUS: 再跑 X 次 close` | 按提示继续(脚本会说优先观察什么) |
| `PLAN_A: 切 Core-Shell Cycle` | UI 切 ★ Core-Shell Cycle |
| `CHAIN_END: 切链尾专用` | UI 切链尾专用 |

---

## 常见坑

- **同一 visit 多个塌陷格 → 每个塌陷一行**,visit 用同一数字。
- **锁挡住的格子 → 仍然记一行**,`result=skip`,`has_lock=true`。这是判定锁机制的关键数据。
- **cut vertex 在 0.5 应该 downgrade no-op**(path→path 无变化)。如果实测显示 cut vertex 上的 path 被 remove,**说明 0.5 跟我们假设不同**,需要更新 sim。
- **建筑师 (0,0) / Atziri 方向 (0,4)** 不要塌(模板没放,不会成 target)。
- **第 1 次 close 不算**,因为模板还没经历过塌陷,可能附带 entry destabilise(~2 房)。从 visit 2 开始记主要数据。

---

## 数据量参考

| 已记录观测数 | 通常能判定到 |
|---|---|
| < 10 | PENDING(数据不足) |
| 10-15 | 可能 AMBIGUOUS |
| 20-30 | 一般能确定单一 mode |
| > 30 | 高置信度 |

如果 20 观测后仍 AMBIGUOUS,看脚本提示该补什么类型(可能需要远端 / path 命中 / cut vertex 样本)。

---

## 不要做

- **不要主动通顶部老板**(打了 Atziri 触发大塌陷,probe 数据被污染)
- **不要在 probe 阶段切模板**(切了距离梯度变,旧数据不可比)
- **不要凭直觉判断,等数据**(15 观测前不切主推)
