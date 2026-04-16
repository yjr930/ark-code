# 当前阶段进度追踪

## 1. 当前状态摘要

- 当前阶段：重新开始前的回退整理
- 总体状态：进行中
- 当前重点：先统一文档口径，再从干净代码状态重新开始实现
- 下一步：基于修正后的五层目录蓝图，重新制定实现顺序
- 当前阻塞：`packages/engine-core/src/` 已清空，代码实现需要从干净状态重新开始

## 2. 里程碑进度

| 阶段 | 目标 | 状态 | 涉及路径 | 测试状态 | 验收状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 文档口径统一 | 统一五层嵌套目录口径 | 已完成 | `docs/design/engine-core/*.md` | 文档自检完成 | 已完成 | 已消除五层嵌套与平铺目录冲突 |
| 代码回退 | 清理不符合约束的 `engine-core/src` 实现 | 已完成 | `packages/engine-core/src/` | 已完成 | 已完成 | 已删除当前这轮实现，准备重新开始 |
| 新一轮实现计划 | 基于修正后的蓝图重新安排实现顺序 | 未开始 | `docs/design/engine-core/07_current_phase_implementation_plan.md` | 未开始 | 未开始 | 下一步工作 |

## 3. 工作包明细

| 工作包 | 路径 | 状态 | 最近进展 | 测试情况 | 风险 / 阻塞 |
| --- | --- | --- | --- | --- | --- |
| 目录层级设计 | `docs/design/engine-core/01_layers_and_dependencies.md` | 已完成 | 继续保持五层嵌套目录定义 | 文档自检完成 | 无 |
| 归位矩阵修正 | `docs/design/engine-core/06_inventory_mapping.md` | 已完成 | 已统一到五层嵌套目录路径，补了 OpenCC 参照范围与关键代码路径，并追加完整性核对结论 | 文档自检完成 | 仍需后续做清单级逐项核查 |
| 实现计划修正 | `docs/design/engine-core/07_current_phase_implementation_plan.md` | 已完成 | 已加入“严格对齐 OpenCC 引擎逻辑”的硬约束 | 文档自检完成 | 后续需按新口径重排阶段实现 |
| OpenCC 对齐疑问文档 | `docs/design/engine-core/09_opencc_alignment_issues.md` | 已完成 | 已建立高风险疑问留痕文档 | 文档自检完成 | 无 |
| inventory 覆盖核对文档 | `docs/design/engine-core/10_inventory_coverage_audit.md` | 已完成 | 已完成主功能组覆盖、主闭环覆盖与缺项结论 | 文档自检完成 | 仍未到逐条 checklist 级映射 |
| inventory 清单级映射文档 | `docs/design/engine-core/11_inventory_checklist_mapping.md` | 已完成 | 已完成对两个 inventory 的逐条映射，并明确“已完成 checklist 级功能承接、仍需细粒度语义拆分” | 文档自检完成 | 后续仍需继续细化高风险条目 |

| inventory 覆盖补齐 | `docs/design/engine-core/06_inventory_mapping.md` | 已完成 | 已把 checklist 中缺少承接组的条目补进归位矩阵 | 文档自检完成 | 已从“是否覆盖”推进到“是否足够细” |

| 当前阶段核对清单修正 | `docs/design/engine-core/99_current_phase_scope_and_checklist.md` | 已完成 | 已统一到五层嵌套目录路径 | 文档自检完成 | 无 |

| engine-core 当前代码 | `packages/engine-core/src/` | 已清理 | 已删除当前这轮不符合约束的实现 | 已完成 | 需要重新开始 |

## 4. 已完成记录

### 2026-04-16

- 发现 `engine-core/src` 当前实现没有按五层嵌套目录落位
  - 影响：实现与设计蓝图不一致，不能继续在错误目录结构上追加功能

- 修正设计文档中的目录路径冲突
  - 路径：`06_inventory_mapping.md` `07_current_phase_implementation_plan.md` `99_current_phase_scope_and_checklist.md`
  - 验证：目录口径已统一到 `src/core/` `src/assembly/` `src/execution/` `src/domains/` `src/semantics/`

- 为 `06_inventory_mapping.md` 补充 OpenCC 参照范围与关键代码路径
  - 路径：`docs/design/engine-core/06_inventory_mapping.md`
  - 验证：每个功能组已增加 OpenCC 代码来源字段

- 对 `06_inventory_mapping.md` 做完整性核对
  - 路径：`docs/design/engine-core/06_inventory_mapping.md`
  - 验证：已补主能力组缺项，并写明“主功能组已覆盖、清单级逐项核查仍未完成”的结论

- 为实现计划增加 OpenCC 严格对齐约束，并建立疑问清单文档
  - 路径：`docs/design/engine-core/07_current_phase_implementation_plan.md` `docs/design/engine-core/09_opencc_alignment_issues.md`
  - 验证：已明确“先查清 OpenCC 来源，再实现”的硬约束

- 对 `06_inventory_mapping.md` 做主功能组与主闭环级的完整性核对
  - 路径：`docs/design/engine-core/10_inventory_coverage_audit.md`
  - 验证：已确认无明显大项遗漏

- 完成两个 inventory 的逐条映射
  - 路径：`docs/design/engine-core/11_inventory_checklist_mapping.md`
  - 验证：已完成 checklist 级功能承接，并明确后续问题已转为细粒度语义拆分

- 对 `06_inventory_mapping.md` 补齐 checklist 缺少承接组的条目
  - 路径：`docs/design/engine-core/06_inventory_mapping.md`
  - 验证：当前主要问题已从“有没有覆盖”变成“是否拆得足够细” 

- 清理 `packages/engine-core/src/` 当前实现
  - 路径：`packages/engine-core/src/`
  - 验证：目录已删除，准备从干净状态重新开始

## 5. 当前阻塞与待决事项

| 类型 | 内容 | 影响 | 处理建议 |
| --- | --- | --- | --- |
| 结构阻塞 | 当前代码已清理，需要重新建立 `engine-core/src/` | 无法继续沿用上一轮实现 | 按五层嵌套目录从头实现 |
| 计划待决 | 新一轮实现顺序需要重新确认 | 直接编码会重复犯错 | 先重写计划，再动代码 |
| 语义风险 | prompt compiler、results、approval、attachment 属于高风险能力 | 如果继续凭空补实现，会再次偏离 OpenCC 语义 | 先按盘点梳理真实来源和编译链 |
| 细化待决 | checklist 已完成承接，但仍有部分条目只细化到功能组层 | 重新开始实现前，高风险条目仍需继续细化 | 优先把高风险部分覆盖项补到 `06` 或记入 `09` |

## 6. 验证记录

| 验证项 | 状态 | 方法 | 结果 | 备注 |
| --- | --- | --- | --- | --- |
| 文档层级口径统一 | 已完成 | 阅读并修正 design 文档 | 已通过 | 已统一到五层嵌套目录 |
| OpenCC 代码映射补齐 | 已完成 | 更新 `06_inventory_mapping.md` | 已通过 | 每个功能组已增加 OpenCC 参照范围与关键代码路径 |
| 归位矩阵完整性核对 | 已完成 | 新建 `10_inventory_coverage_audit.md` 并对照 `99_gap_checklist.md`、`99_verification_matrix.md` | 已通过 | 已确认无明显大项遗漏 |
| 对齐疑问文档建立 | 已完成 | 新建 `09_opencc_alignment_issues.md` | 已通过 | 高风险疑问已留痕 |
| inventory 逐条映射 | 已完成 | 新建 `11_inventory_checklist_mapping.md` 并对照两份 checklist | 已通过 | 已完成 checklist 级功能承接 |
| inventory 覆盖补齐 | 已完成 | 更新 `06_inventory_mapping.md` | 已通过 | 当前主要问题已从覆盖转为细粒度拆分 |
| 当前错误实现已清理 | 已完成 | 删除 `packages/engine-core/src/` | 已通过 | 代码回到干净状态 |

## 7. 文档同步检查

- [x] `06_inventory_mapping.md` 已统一目录口径
- [x] `07_current_phase_implementation_plan.md` 已统一目录口径
- [x] `99_current_phase_scope_and_checklist.md` 已统一目录口径
- [x] `09_opencc_alignment_issues.md` 已建立
- [x] `10_inventory_coverage_audit.md` 已建立
- [x] `11_inventory_checklist_mapping.md` 已建立
- [x] 当前进度追踪文档已回写当前状态
- [ ] 重新开始前，重写新的实现计划

## 8. 更新规则

- 文档口径先统一，再开始代码实现
- 代码实现若偏离蓝图，先停下修文档与计划，不继续追加
- 每次回退或重排，都记录到本文件
- checklist 已有承接组后，后续重点转为高风险条目的细粒度语义拆分

## 9. 当前结论

当前工作已经推进到：

- 文档冲突已修正
- checklist 已完成功能承接
- 代码实现已清空

下一步不是继续补“有没有覆盖”，而是：

1. 重新制定实现计划
2. 优先继续细化高风险部分覆盖项
3. 再从 `packages/engine-core/src/` 干净状态重新开始

| 当前阶段核对清单修正 | `docs/design/engine-core/99_current_phase_scope_and_checklist.md` | 已完成 | 已统一到五层嵌套目录路径 | 文档自检完成 | 无 |
| engine-core 当前代码 | `packages/engine-core/src/` | 已清理 | 已删除当前这轮不符合约束的实现 | 已完成 | 需要重新开始 |

## 4. 已完成记录

### 2026-04-16

- 发现 `engine-core/src` 当前实现没有按五层嵌套目录落位
  - 影响：实现与设计蓝图不一致，不能继续在错误目录结构上追加功能

- 修正设计文档中的目录路径冲突
  - 路径：`06_inventory_mapping.md` `07_current_phase_implementation_plan.md` `99_current_phase_scope_and_checklist.md`
  - 验证：目录口径已统一到 `src/core/` `src/assembly/` `src/execution/` `src/domains/` `src/semantics/`

- 为 `06_inventory_mapping.md` 补充 OpenCC 参照范围与关键代码路径
  - 路径：`docs/design/engine-core/06_inventory_mapping.md`
  - 验证：每个功能组已增加 OpenCC 代码来源字段

- 对 `06_inventory_mapping.md` 做完整性核对
  - 路径：`docs/design/engine-core/06_inventory_mapping.md`
  - 验证：已补主能力组缺项，并写明“主功能组已覆盖、清单级逐项核查仍未完成”的结论

- 为实现计划增加 OpenCC 严格对齐约束，并建立疑问清单文档
  - 路径：`docs/design/engine-core/07_current_phase_implementation_plan.md` `docs/design/engine-core/09_opencc_alignment_issues.md`
  - 验证：已明确“先查清 OpenCC 来源，再实现”的硬约束

- 对 `06_inventory_mapping.md` 做主功能组与主闭环级的完整性核对
  - 路径：`docs/design/engine-core/10_inventory_coverage_audit.md`
  - 验证：已确认无明显大项遗漏，但尚未到逐条 checklist 级映射

- 完成两个 inventory 的逐条映射
  - 路径：`docs/design/engine-core/11_inventory_checklist_mapping.md`
  - 验证：已按“已覆盖 / 部分覆盖 / 未覆盖”完成逐条映射

- 清理 `packages/engine-core/src/` 当前实现
  - 路径：`packages/engine-core/src/`
  - 验证：目录已删除，准备从干净状态重新开始

## 5. 当前阻塞与待决事项

| 类型 | 内容 | 影响 | 处理建议 |
| --- | --- | --- | --- |
| 结构阻塞 | 当前代码已清理，需要重新建立 `engine-core/src/` | 无法继续沿用上一轮实现 | 按五层嵌套目录从头实现 |
| 计划待决 | 新一轮实现顺序需要重新确认 | 直接编码会重复犯错 | 先重写计划，再动代码 |
| 语义风险 | prompt compiler、results、approval、attachment 属于高风险能力 | 如果继续凭空补实现，会再次偏离 OpenCC 语义 | 先按盘点梳理真实来源和编译链 |

## 6. 验证记录

| 验证项 | 状态 | 方法 | 结果 | 备注 |
| --- | --- | --- | --- | --- |
| 文档层级口径统一 | 已完成 | 阅读并修正 design 文档 | 已通过 | 已统一到五层嵌套目录 |
| OpenCC 代码映射补齐 | 已完成 | 更新 `06_inventory_mapping.md` | 已通过 | 每个功能组已增加 OpenCC 参照范围与关键代码路径 |
| 归位矩阵完整性核对 | 已完成 | 新建 `10_inventory_coverage_audit.md` 并对照 `99_gap_checklist.md`、`99_verification_matrix.md` | 已通过 | 已确认无明显大项遗漏 |
| 对齐疑问文档建立 | 已完成 | 新建 `09_opencc_alignment_issues.md` | 已通过 | 高风险疑问已留痕 |
| inventory 清单级逐条映射 | 已完成 | 新建 `11_inventory_checklist_mapping.md` 并对照两份 checklist | 已通过 | 已明确已覆盖 / 部分覆盖 / 未覆盖 |
| 当前错误实现已清理 | 已完成 | 删除 `packages/engine-core/src/` | 已通过 | 代码回到干净状态 |

## 7. 文档同步检查

- [x] `06_inventory_mapping.md` 已统一目录口径
- [x] `07_current_phase_implementation_plan.md` 已统一目录口径
- [x] `99_current_phase_scope_and_checklist.md` 已统一目录口径
- [x] 当前进度追踪文档已回写回退状态
- [ ] 重新开始前，重写新的实现计划

## 8. 更新规则

- 文档口径先统一，再开始代码实现
- 代码实现若偏离蓝图，先停下修文档与计划，不继续追加
- 每次回退或重排，都记录到本文件

## 9. 当前结论

当前工作已经回退到“文档冲突已修正、代码实现已清空”的状态。

下一步不是继续在旧实现上补丁，而是：

1. 按五层嵌套目录重新确认实现计划
2. 确认 prompt compiler、results、approval 等高风险能力的真实来源
3. 再从 `packages/engine-core/src/` 干净状态重新开始
