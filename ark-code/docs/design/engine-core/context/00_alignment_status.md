# context 模块对齐状态

## 0. 文档目标

本文记录 Ark Code `engine-core/context` 与 OpenCC 对应实现的当前对齐状态。

本文记录两类状态：

- 当前有哪些函数已经实现，以及每个函数与 OpenCC 对应逻辑的对齐程度
- 当前仍阻止 `context` 模块达到严格一致的关键问题

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
| `getUsingYourToolsSection()` | `constants/prompts.ts:getUsingYourToolsSection()` | 严格一致 | 当前已按 OpenCC 同一分支结构实现：taskToolName 选择、REPL 分支、embedded-search 分支、providedToolSubitems/items 拼装及文案均与对应逻辑一致 |
| `getToneAndStyleSection()` | `constants/prompts.ts:getSimpleToneAndStyleSection()` | 严格一致 | 当前已按 OpenCC 同一 items 列表与 `prependBullets()` 拼装方式实现 |
| `getOutputEfficiencySection()` | `constants/prompts.ts:getOutputEfficiencySection()` | 严格一致 | 当前已按 OpenCC 同一 `USER_TYPE === 'ant'` 分支与非-ant 分支正文实现 |
| `getEnvInfoSection()` | `constants/prompts.ts:computeSimpleEnvInfo()` | 严格一致 | 当前已按 OpenCC 对齐 cwd、git repo、additional working directories、worktree 分支、undercover 抑制分支、model canonical / marketing name 解析、knowledge cutoff、最新模型家族 / Claude Code 可用形态 / fast mode 文案与输出结构 |
| `getMcpInstructionsSection()` | `constants/prompts.ts:getMcpInstructions()` | 严格一致 | 当前已按 OpenCC 对齐 connected 过滤、instructions 过滤、per-server instruction block 结构、空结果返回 null 与最终文案 |
| `getSessionSpecificGuidanceSection()` | `constants/prompts.ts:getSessionSpecificGuidanceSection()` | 严格一致 | 当前已按 OpenCC 对齐 AskUser / interactive session / Agent / Explore / Skill / DiscoverSkills / verification 条件分支、空结果返回 null 与同结构拼装；Ark 运行时输入已收敛到 host state |
| `getDefaultSystemPromptSections()` | `constants/prompts.ts:getSystemPrompt()` | 部分对齐 | 当前已对齐主组装结构与大部分 section，但 proactive/brief/mcp delta 等分支的真实来源仍是 Ark 侧承载位；新增 section registry 仅具备最小结构，尚未具备 OpenCC 的 cache 语义 |
| `buildDefaultSystemPrompt()` | `constants/prompts.ts:getSystemPrompt()` | 部分对齐 | 当前只是将 `getDefaultSystemPromptSections()` 的结果转换为 `SystemPrompt`；由于上游 section 组装仍未完全达到严格一致，本函数不能单独判定为严格一致 |
| `buildEffectiveSystemPrompt()` | `utils/systemPrompt.ts:buildEffectiveSystemPrompt()` | 部分对齐 | 当前已对齐主要优先级骨架，但 agent/coordinator/proactive 的真实来源仍是 Ark 侧简化输入；built-in agent `getSystemPrompt(...)`、memory 埋点与 coordinator/proactive 真源尚未对齐 |
| `appendSystemContext()` | `utils/api.ts:appendSystemContext()` | 严格一致 | 输入、拼装方式、输出语义与 OpenCC 对应逻辑一致 |
| `renderSystemPrompt()` | 无直接同名函数 | 无直接对应 | Ark Code 自己的 model port 适配辅助函数 |
| `mergePromptSections()` | 无直接同名函数 | 无直接对应 | Ark Code 辅助函数 |
| `applyCustomSystemPrompt()` | `utils/systemPrompt.ts` 内部逻辑的一部分 | 部分对齐 | 语义方向一致，但不是 OpenCC 一一对应函数 |
| `applyAppendSystemPrompt()` | `utils/systemPrompt.ts` 内部逻辑的一部分 | 部分对齐 | 语义方向一致，但不是 OpenCC 一一对应函数 |

## 3.1.1 prompt-builder.ts 当前问题追踪

### A. `getDefaultSystemPromptSections()` 仍未严格一致的原因

1. `simple mode`、`proactive`、`brief`、`mcp instructions delta` 等分支已经有结构承载，但真实来源仍未对齐到 OpenCC 对应子系统。
2. 新增的 `system-prompt-sections.ts` 目前只对齐了 API 形状，没有对齐 OpenCC 的 section cache / clear 语义。
3. `language`、`outputStyle`、`antModelOverride`、`scratchpadPath`、`functionResultClearingKeepRecent`、`proactiveSection`、`briefProactiveSection` 等输入当前主要来自 Ark 侧 host state 承载位，不是 OpenCC 对应 runtime 的真实来源。

### B. `buildDefaultSystemPrompt()` 仍未严格一致的原因

1. 本函数本身逻辑很薄，当前只是把 section 结果转换为 `SystemPrompt`。
2. 由于上游 `getDefaultSystemPromptSections()` 仍未达到严格一致，本函数不能单独判定为严格一致。

### C. `buildEffectiveSystemPrompt()` 仍未严格一致的原因

1. `proactiveEnabled` 当前存在双真源：默认 prompt 组装读取 `hostState.promptFeatures.proactiveEnabled`，effective prompt 组合读取 `config.effectivePromptContext?.features?.proactiveEnabled`。
2. `mainThreadAgentDefinition` 当前只承载 `systemPrompt?: string`，尚未对齐 OpenCC 中 built-in agent / custom agent 两类 `getSystemPrompt(...)` 获取方式。
3. OpenCC 的 agent memory loaded 埋点、coordinator mode 真实来源与 proactive 真正生效条件仍未对齐。
4. `customSystemPrompt + agentSystemPrompt + proactive` 组合下的优先级矩阵尚未通过真实来源闭环验证。

### D. prompt-builder 额外新增函数与结构性问题

1. `system-prompt-sections.ts` 当前只有最小 section registry 结构，`cacheBreak` 与 `name` 元数据尚未被用于真实缓存语义。
2. `prompt-builder.ts` 为承载 OpenCC 分支补入了多组 helper，这些 helper 当前有一部分只是 Ark 侧桥接函数，不应误判为已经完全等价于 OpenCC 对应模块。
3. `loadPromptMemory()` 当前同时参与 system prompt 与 user context 注入，存在重复注入风险，需要在后续对齐中确认唯一注入路径。
4. `replModeEnabled`、MCP client ownership、promptFeatures 若继续扩展，必须收敛单一真源，避免 prompt 组装与运行时状态再次分裂。

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

