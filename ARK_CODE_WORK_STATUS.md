# Ark Code 当前工作状态

## 1. 当前目标

当前正在按 `ark-code/docs/design/engine-core/context/00_alignment_status.md` 的函数级表格，逐项对齐 `ark-code/packages/engine-core/src/context/prompt-builder.ts` 与 OpenCC 对应逻辑。

要求是：

- 一次只对齐一项
- 每一项都要做到严格对齐
- 每完成一项就更新状态表
- 每一步都要先保证代码仍然可构建、可测试

---

## 2. 已完成的对齐项

`prompt-builder.ts` 中，以下项已经完成并在状态表中标记为 `严格一致`：

- `asSystemPrompt()`
- `getIntroSection()`
- `getSystemSection()`
- `getDoingTasksSection()`
- `getActionsSection()`
- `getTaskToolName()`
- `getUsingYourToolsSection()`
- `getToneAndStyleSection()`
- `getOutputEfficiencySection()`

相关状态文档：

- `ark-code/docs/design/engine-core/context/00_alignment_status.md`

---

## 3. 当前正在做的项

当前进行中的项：

- `getEnvInfoSection()`

对应任务：

- Task `#23`：`对齐 getEnvInfoSection`

当前已推进到：

1. 新增了环境信息依赖文件：
   - `ark-code/packages/engine-core/src/context/env-info.ts`
2. 已补入这些最小来源函数：
   - `getIsGit(cwd)`
   - `getShellInfoLine()`
   - `getUnameSR()`
   - `getKnowledgeCutoff(modelId)`
   - `getMarketingNameForModel(modelId)`
3. `prompt-builder.ts` 中的 `getEnvInfoSection()` 已改成 `async`
4. `getDefaultSystemPromptSections()` 已开始 `await getEnvInfoSection(config)`
5. 当前代码可以 `build` 通过

---

## 4. 当前真实状态

当前 `getEnvInfoSection()` 还**没有完成严格对齐**。

还缺的点包括：

- `additionalWorkingDirectories`
- worktree 分支
- undercover 分支
- 最新模型家族说明文案
- Claude Code 可用形态文案
- fast mode 文案
- 与 OpenCC 更一致的 model canonical / marketing name 解析

因此：

- 这一项仍处于进行中
- 不能提前把状态表改成 `严格一致`

---

## 5. 目前需要特别注意的点

### 5.1 不要一次改多项

当前约定是：

- 只围绕 `prompt-builder.ts` 表格中的**当前这一项**推进
- 一项没完成之前，不要跳到下一项
- 不要顺手改其他 section

### 5.2 每一步都要防止污染 `prompt-builder.ts`

在之前的推进过程中，`prompt-builder.ts` 多次因为编辑过程混入无关文本而被污染。

因此后续修改必须遵守：

- 先精确读取目标片段
- 只改当前函数对应片段
- 改完立刻执行构建或测试验证
- 如果文件被污染，优先恢复到最近可构建版本，再继续

### 5.3 不要回滚用户已确认的外部改动

当前已有用户或外部过程确认过的改动包括：

- `ark-code/docs/design/engine-core/README.md`
- `ark-code/packages/engine-core/src/query/run-turn.ts`
- `ark-code/packages/engine-core/src/context/env-info.ts`

这些改动都应视为当前正确状态的一部分，不要在后续对齐中回滚。

### 5.4 状态文档只以函数级表格为准

`00_alignment_status.md` 现在只保留函数级状态表，不再单独维护一段“未对齐点列表”。

因此后续状态更新规则是：

- 某函数完成对齐：只更新表格该行
- 不再额外写一段主观归纳列表

---

## 6. 下一步操作指示

下一步继续只做这一项：

- `getEnvInfoSection()`

建议顺序：

1. 先读取 OpenCC `computeSimpleEnvInfo()` 还未覆盖的剩余字段逻辑
2. 在 `env-info.ts` 中补齐最小来源函数
3. 再更新 `prompt-builder.ts` 的 `getEnvInfoSection()`
4. 执行：
   - `pnpm --dir "/Users/jirong.you/workspace/others/oc-cc-coder/ark-code" build`
   - 如有需要再执行 `test`
5. 仅当该项输入来源、条件分支、输出结构都与 OpenCC 一致时，才把状态表改为 `严格一致`

在 `getEnvInfoSection()` 完成之前，不要继续推进：

- `getMcpInstructionsSection()`
- `getSessionSpecificGuidanceSection()`
- `getDefaultSystemPromptSections()`
- `buildDefaultSystemPrompt()`
- `buildEffectiveSystemPrompt()`

---

## 7. 当前相关文件

主要代码文件：

- `ark-code/packages/engine-core/src/context/prompt-builder.ts`
- `ark-code/packages/engine-core/src/context/env-info.ts`
- `ark-code/packages/engine-core/src/runtime/tools/tool-names.ts`
- `ark-code/packages/engine-core/src/runtime/tools/repl-mode.ts`
- `ark-code/packages/engine-core/src/runtime/tools/embedded-search.ts`

主要状态文件：

- `ark-code/docs/design/engine-core/context/00_alignment_status.md`

根目录本状态文件：

- `ARK_CODE_WORK_STATUS.md`
