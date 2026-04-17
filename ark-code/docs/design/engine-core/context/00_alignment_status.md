# context 模块对齐状态

## 0. 文档目标

本文记录 Ark Code `engine-core/context` 与 OpenCC 对应实现的当前对齐状态。

本文只回答两个问题：

- 当前有哪些函数已经实现
- 每个函数与 OpenCC 对应逻辑的对齐程度是什么

本文不再单独归纳“未对齐点”列表，完整状态以函数级对齐状态表为准。

本文用于持续追踪，不代表设计完成，也不代表实现已经严格对齐。

---

## 1. 状态分级

- **严格一致**：输入来源、条件分支、优先级、输出语义与 OpenCC 对应逻辑一致
- **部分对齐**：主结构或核心语义已对齐，但条件分支、来源、格式、细节仍有差异
- **未对齐**：目前只是 Ark Code 自己的简化实现，或逻辑明显不同
- **无直接对应**：OpenCC 中没有一一对应函数，该函数只是 Ark Code 的拆分辅助函数

---

## 2. 总体结论

当前 `context` 模块的结论如下：

- 主结构已经开始向 OpenCC 收敛
- `fetchSystemPromptParts -> buildEffectiveSystemPrompt -> appendSystemContext -> prependUserContext` 这条主链已经建立
- 只有极少数函数达到严格一致
- 大部分函数仍处于“部分对齐”或“未对齐”状态

当前唯一可确认的 **严格一致** 项：

- `appendSystemContext()`

---

## 3. 函数级对齐状态

## 3.1 prompt-builder.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `asSystemPrompt()` | `utils/systemPromptType.ts` | 严格一致 | Ark 当前已改成 branded readonly `SystemPrompt`，实现方式与 OpenCC 对应函数一致 |
| `getIntroSection()` | `constants/prompts.ts:getSimpleIntroSection()` | 严格一致 | 当前已按 OpenCC 同一文案结构实现：interactive agent + software engineering tasks + `CYBER_RISK_INSTRUCTION` + 禁止猜 URL；当前阶段固定走 `outputStyleConfig === null` 分支，与现有 Ark 语义一致 |
| `getSystemSection()` | `constants/prompts.ts:getSimpleSystemSection()` | 严格一致 | 当前已按 OpenCC 同一 items 列表、`getHooksSection()` 内容与 `prependBullets()` 拼装方式实现 |
| `getDoingTasksSection()` | `constants/prompts.ts:getSimpleDoingTasksSection()` | 严格一致 | 当前已按 OpenCC 同一 items/codeStyleSubitems/userHelpSubitems 结构、同一 `AskUserQuestion` 引用语义与同一外部反馈地址实现 |
| `getActionsSection()` | `constants/prompts.ts:getActionsSection()` | 严格一致 | 当前已按 OpenCC 同一完整正文实现 |
| `getTaskToolName()` | `constants/prompts.ts:269` 附近 task tool 选择逻辑 | 严格一致 | 当前已按 OpenCC 同一固定候选顺序 `TaskCreate -> TodoWrite` 选择 task tool |
| `getUsingYourToolsSection()` | `constants/prompts.ts:getUsingYourToolsSection()` | 部分对齐 | 当前已补上与 OpenCC 同结构的 REPL 分支与 embedded-search 分支，并已接入 Ark host state 的真实运行态字段；但工具名常量与 OpenCC 常量源仍未完全统一，且分支能力来源仍是 Ark 自己的宿主状态而非 OpenCC 原始实现 |
| `getToneAndStyleSection()` | `constants/prompts.ts:getSimpleToneAndStyleSection()` | 未对齐 | 当前只是极简版 |
| `getOutputEfficiencySection()` | `constants/prompts.ts:getOutputEfficiencySection()` | 部分对齐 | 核心方向一致，但不是 OpenCC 完整文案 |
| `getEnvInfoSection()` | `constants/prompts.ts:computeSimpleEnvInfo()` | 部分对齐 | 已有 cwd/platform/os/model，但缺 shell、git repo、additional directories 等 |
| `getMcpInstructionsSection()` | `constants/prompts.ts:getMcpInstructions()` | 部分对齐 | 当前只列 server name，没有 per-server instructions block |
| `getSessionSpecificGuidanceSection()` | `constants/prompts.ts:getSessionSpecificGuidanceSection()` | 部分对齐 | 当前只保留少量 guidance，缺 AskUser/Agent/Skills 等条件逻辑 |
| `getDefaultSystemPromptSections()` | `constants/prompts.ts:getSystemPrompt()` | 部分对齐 | 已是多 section 组装，但 section 集合与条件分支远少于 OpenCC |
| `buildDefaultSystemPrompt()` | `constants/prompts.ts:getSystemPrompt()` | 未对齐 | 只是把当前 Ark sections flatten，不是 OpenCC 等价结果 |
| `buildEffectiveSystemPrompt()` | `utils/systemPrompt.ts:buildEffectiveSystemPrompt()` | 部分对齐 | 已支持 `override -> agent -> custom -> default -> append` 主骨架，但缺 coordinator/proactive 等分支 |
| `appendSystemContext()` | `utils/api.ts:appendSystemContext()` | 严格一致 | 输入、拼装方式、输出语义与 OpenCC 对应逻辑一致 |
| `renderSystemPrompt()` | 无直接同名函数 | 无直接对应 | Ark Code 自己的 model port 适配辅助函数 |
| `mergePromptSections()` | 无直接同名函数 | 无直接对应 | Ark Code 辅助函数 |
| `applyCustomSystemPrompt()` | `utils/systemPrompt.ts` 内部逻辑的一部分 | 部分对齐 | 语义方向一致，但不是 OpenCC 一一对应函数 |
| `applyAppendSystemPrompt()` | `utils/systemPrompt.ts` 内部逻辑的一部分 | 部分对齐 | 语义方向一致，但不是 OpenCC 一一对应函数 |

## 3.2 context-assembly.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `fetchSystemPromptParts()` | `utils/queryContext.ts:fetchSystemPromptParts()` | 部分对齐 | 已保留三块返回值和 custom prompt 特判，但还没纳入 tools/model/additional dirs/mcpClients 等真实输入 |
| `prependUserContext()` | `utils/api.ts:prependUserContext()` | 部分对齐 | 前置 `<system-reminder>` 语义已对齐，但 message 构造与条件分支未完全一致 |
| `assembleTurnContext()` | `QueryEngine.ts + queryContext.ts + api.ts` 的组合逻辑 | 部分对齐 | 是正确的 Ark 总装配点，但不是 OpenCC 原样实现 |

## 3.3 system-context.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `getSystemContext()` | `context.ts:getSystemContext()` | 部分对齐 | 当前只返回 `gitStatus`，缺 cache breaker 与其他 system-side 语义 |

## 3.4 git-status.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `getGitStatus()` | `context.ts:getGitStatus()` | 部分对齐 | 输出结构方向一致，但 `main branch` 获取逻辑当前不正确，且缺 OpenCC 的 git repo 检查与更完整分支逻辑 |

## 3.5 user-context.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `buildUserContextParts()` | `context.ts:getUserContext()` 内部聚合语义 | 部分对齐 | 方向正确，但不是 OpenCC 一一对应函数 |
| `collectUserVisibleMemory()` | 无直接对应 | 无直接对应 | Ark Code 辅助函数 |
| `getUserContext()` | `context.ts:getUserContext()` | 部分对齐 | 已纳入 `claudeMd/currentDate/memory`，但缺 disable 开关、bare 模式、cached content 等逻辑 |

## 3.6 claude-md.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `readTextFile()` | 无直接对应 | 无直接对应 | Ark Code 辅助函数 |
| `loadRulesDir()` | `utils/claudemd.ts` 中 rules 扫描逻辑的一部分 | 部分对齐 | 已纳入 `.claude/rules/*.md`，但缺 include/frontmatter/comment strip |
| `listAncestorDirectories()` | `utils/claudemd.ts` 中向上发现逻辑 | 部分对齐 | 方向一致 |
| `loadDirectoryClaudeMd()` | `utils/claudemd.ts` 项目级/本地级发现逻辑的一部分 | 部分对齐 | 已纳入 project/local 级别主要来源 |
| `loadClaudeMdFiles()` | `utils/claudemd.ts` 文件收集主逻辑 | 部分对齐 | 项目级来源模型已开始对齐，但缺 managed/user/automem/include 等 |
| `filterInjectedClaudeMdFiles()` | 近似 `filterInjectedMemoryFiles()` | 未对齐 | 当前只是路径去重，和 OpenCC 的 injected filter 不是同一语义 |
| `renderClaudeMdContext()` | `getClaudeMds(...)` 一类 render 逻辑 | 部分对齐 | 当前只是简单拼接，不是 OpenCC 的完整 render 语义 |
| `loadClaudeMd()` | `context.ts:getUserContext()` 中 `getClaudeMds(filterInjectedMemoryFiles(await getMemoryFiles()))` | 部分对齐 | 主链已建立，但来源与过滤逻辑还差很远 |

## 3.7 memory.ts

| Ark Code 函数 | OpenCC 对应 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| `readTextFile()` | 无直接对应 | 无直接对应 | Ark Code 辅助函数 |
| `getDefaultPromptMemoryEntrypoints()` | `memdir/paths.ts:getAutoMemEntrypoint()` / `utils/config.ts:getMemoryPath()` | 部分对齐 | 只纳入 env entrypoint 与 `~/.claude/MEMORY.md`，缺完整 memory 层级 |
| `loadMemoryFiles()` | `memdir/memdir.ts:loadMemoryPrompt()` 的来源读取部分 | 部分对齐 | 只对齐了 entrypoint 读取这一层 |
| `filterMemoryFilesForPrompt()` | 无直接同名函数 | 部分对齐 | 只有去重语义，没有 OpenCC 更复杂的过滤 |
| `renderMemoryContext()` | `memdir/memdir.ts` memory prompt 组装语义 | 未对齐 | 当前只是枚举文件内容，OpenCC 是 memory 使用规则 prompt |
| `loadPromptMemory()` | `memdir/memdir.ts:loadMemoryPrompt()` | 部分对齐 | 已有单独入口，但缺 auto-memory/team/daily-log/extra-guidelines 等关键分支 |

---

## 5. 后续维护规则

后续每次修改 `context` 模块后，都应同步更新本文：

- 新增函数时，把函数加入表格
- 对齐状态发生变化时，调整“当前状态”列
- 如果某项从“部分对齐”升级为“严格一致”，必须说明依据的 OpenCC 对应代码

