# context 模块设计

## 0. 模块定位

`context/` 负责为一次 turn 组装完整上下文。

它的产出不是 UI 文本，而是 `query/` 可直接消费的结构化上下文：

- system prompt
- user context
- system context
- 本轮工具与 agent 可见集
- 本轮可见 MCP 资源信息

---

## 1. 职责与要求

### 职责

- 汇总 prompt 来源
- 组装 system / user / system-context
- 读取 CLAUDE.md、memory、日期、git 状态等环境信息
- 形成 query 的输入上下文对象

### 要求

- `context/` 只负责组装，不负责模型调用
- `context/` 不直接运行工具
- `context/` 的输出必须可缓存、可复用、可测试
- 任何上下文来源都必须明确归属：系统、用户、工作目录、session、MCP

---

## 2. 下属文件规划

```text
context/
  system-context.ts
  user-context.ts
  prompt-builder.ts
  context-assembly.ts
  claude-md.ts
  memory.ts
  git-status.ts
```

### 2.1 system-context.ts

职责：

- 生成系统级上下文块
- 对外只暴露结构化 `Record<string, string>`，不处理 prompt 排版

定义内容：

- `getSystemContext(workingDirectory)`
- 后续可补 `buildSystemContextParts()`
- 后续可补 `collectSystemEnvironmentFacts()`

逻辑要求：

- 当前阶段至少生成 `gitStatus`
- `gitStatus` 的生成逻辑下沉到 `git-status.ts`
- 当上游选择跳过 systemContext 时，这一层不应强行补默认值
- 输出结构必须独立于 prompt 排版方式，供 `appendSystemContext()` 统一处理

OpenCC 参照代码：

- `opencc/src/context.ts:getSystemContext()`

### 2.2 user-context.ts

职责：

- 生成用户级上下文块
- 汇总 `CLAUDE.md`、memory、currentDate` 这类 user-side prefix 信息

定义内容：

- `getUserContext(workingDirectory)`
- `buildUserContextParts(workingDirectory)`
- `collectUserVisibleMemory(workingDirectory)`

逻辑要求：

- 当前阶段至少生成：
  - `claudeMd`
  - `memory`（当前为空实现，但保留入口）
  - `currentDate`
- `buildUserContextParts()` 负责真正汇总 `claudeMd` / `memory` / `currentDate`
- `collectUserVisibleMemory()` 当前返回已收集的 `CLAUDE.md` 来源路径，用于后续把“用户可见 memory 来源”与“最终 prompt 内容”分开
- 这里只返回结构化字典，不直接拼装 `<system-reminder>`
- `userContext` 与 session message history 严格分离，后者不在这里维护
- `userContext` 后续应通过 `prependUserContext()` 注入到消息前缀，而不是拼入 system prompt

OpenCC 参照代码：

- `opencc/src/context.ts:getUserContext()`

### 2.3 prompt-builder.ts

职责：

- 管理 system prompt 的分段表示与组合规则
- 不直接读取文件系统上下文，只处理 prompt 段的组合

定义内容：

- `asSystemPrompt()`
- `buildDefaultSystemPrompt(config)`
- `getDefaultSystemPromptSections(config)`
- `buildEffectiveSystemPrompt()`
- `appendSystemContext()`
- `renderSystemPrompt()`
- `mergePromptSections()`
- `applyCustomSystemPrompt()`
- `applyAppendSystemPrompt()`
- `getEnvInfoSection()`
- `getMcpInstructionsSection()`
- `getSessionSpecificGuidanceSection()`

逻辑要求：

- system prompt 必须保持为 `string[]` 分段结构，而不是一开始就压平成单字符串
- `buildDefaultSystemPrompt(config)` 当前已经改成 section 化组装，而不是单条占位文本；它按固定 section 顺序拼出默认 prompt 主体
- 当前默认 section 顺序为：`intro -> system -> doingTasks -> actions -> usingYourTools -> toneAndStyle -> outputEfficiency -> envInfo -> sessionSpecificGuidance -> memory? -> mcpInstructions?`
- 当前实现已经开始显式区分静态 section 与会话相关 section，这一步是在继续对齐 OpenCC `constants/prompts.ts:getSystemPrompt()` 的多 section 组装模式
- `envInfo`、`memory`、`mcpInstructions`、`sessionSpecificGuidance` 当前都已保留独立 section 入口，后续只需要逐项替换内容，不需要再改 prompt-builder 主结构
- `memory` 当前已经不再是空 section，而是会读取固定 entrypoint 并生成单独的 memory prompt section；这一步是在对齐 OpenCC `loadMemoryPrompt()` 的入口语义
- `usingYourTools` 当前已开始按 OpenCC `getUsingYourToolsSection()` 的规则靠拢：强调 dedicated tools 优先、shell 只用于真正需要 shell 语义的场景、存在 task 工具时要用于非平凡任务跟踪、独立工具调用允许并行、依赖链保持串行
- 当前实现还没有完全复制 OpenCC 的 REPL/embedded-search 条件分支，但 section 责任和主规则已经对齐到同一层级
- `buildEffectiveSystemPrompt()` 当前已支持 OpenCC 同方向的优先级骨架：`override -> agent -> custom -> default`，然后再统一 append `appendSystemPrompt`
- `customSystemPrompt` 的语义是替换 default system prompt 主体，不是追加
- `appendSystemPrompt` 的语义是始终追加在最终 system prompt 末尾
- `systemContext` 不直接混入 default prompt 构造，而是在 effective system prompt 生成后，再用 `appendSystemContext()` 追加
- 真正传给 model port 之前，才通过 `renderSystemPrompt()` 压平为字符串

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts:321`
- `opencc/src/utils/systemPrompt.ts`
- `opencc/src/utils/systemPromptType.ts`
- `opencc/src/utils/api.ts:437`
- `opencc/src/constants/prompts.ts`

### 2.4 context-assembly.ts

职责：

- 组装 query 真正消费的总上下文对象
- 承接 OpenCC `fetchSystemPromptParts()` 与 user-context prepend 语义

定义内容：

- `fetchSystemPromptParts(config)`
- `prependUserContext(messages, userContext, config)`
- `assembleTurnContext(config, messages)`

逻辑要求：

- `fetchSystemPromptParts()` 必须先返回三块基础产物：
  - `defaultSystemPrompt`
  - `userContext`
  - `systemContext`
- 当 `customSystemPrompt` 存在时，要对齐 OpenCC：
  - 不构建 default system prompt
  - 不构建 systemContext
  - 即返回 `defaultSystemPrompt=[]`、`systemContext={}`
- `assembleTurnContext()` 必须进一步产出：
  - `systemPrompt`
  - `fullSystemPrompt`
  - `messagesWithUserContext`
- `userContext` 不拼进 system prompt，而是通过 `prependUserContext()` 变成一个前置的 `<system-reminder>` user message，再交给 `query`
- 这里是 `context/` 的总入口，`query/run-turn.ts` 应直接消费这里的产物

OpenCC 参照代码：

- `opencc/src/utils/queryContext.ts`
- `opencc/src/QueryEngine.ts:288`
- `opencc/src/utils/api.ts:449`
- `opencc/src/context.ts`

### 2.5 claude-md.ts

职责：

- 读取和处理 `CLAUDE.md` 来源

定义内容：

- 当前阶段：
  - `loadClaudeMdFiles(workingDirectory)`
  - `filterInjectedClaudeMdFiles(entries)`
  - `renderClaudeMdContext(entries)`
  - `loadClaudeMd(workingDirectory)`

逻辑要求：

- 当前实现已不再只读 cwd 下单个 `CLAUDE.md`，而是沿 `workingDirectory -> root` 逐级收集项目级规则来源
- 当前已纳入的来源包括：
  - `CLAUDE.md`
  - `.claude/CLAUDE.md`
  - `.claude/rules/*.md`
  - `CLAUDE.local.md`
- 当前实现已经开始对齐 OpenCC 的“沿目录向上发现、近目录优先级更高”的来源模型
- 当前阶段仍未接入用户级和托管级 memory 文件，但项目级与本地级来源模型已经落下来了
- `filterInjectedClaudeMdFiles()` 当前负责路径去重，后续可继续扩展到更接近 OpenCC 的注入过滤语义
- `renderClaudeMdContext()` 负责把多来源文件拼成单个 `claudeMd` 上下文块
- `claude-md.ts` 只负责读取与筛选，不负责把内容注入 prompt 或消息前缀

OpenCC 参照代码：

- `opencc/src/utils/claudemd.ts`
- `opencc/src/context.ts`

### 2.6 memory.ts

职责：

- 处理 auto memory 或其他 memory 文件的上下文接入

定义内容：

- 当前阶段：
  - `loadMemoryFiles()`
  - `filterMemoryFilesForPrompt()`
  - `renderMemoryContext()`
  - `loadPromptMemory()`

逻辑要求：

- 当前实现已不再是空函数，而是开始按固定 entrypoint 收集 prompt memory 来源
- 当前纳入的来源包括：
  - `ARKCODE_MEMORY_ENTRYPOINT` 指向的 memory entrypoint
  - `~/.claude/MEMORY.md`
- 当前阶段先对齐 OpenCC `loadMemoryPrompt()` 的“读取 memory entrypoint 并生成 memory section”这一层语义
- 目前还没有对齐 OpenCC 的 auto-memory 目录创建、team memory、daily log、extra guidelines 等扩展能力
- 这里只处理 prompt 读取语义，不处理长期 memory 写入流程
- memory 的写入仍属于工具/runtime 行为
- 后续继续对齐时，应优先把 entrypoint 解析与路径来源逻辑向 OpenCC `getAutoMemEntrypoint()` / `getMemoryPath()` 收紧
- `renderMemoryContext()` 当前负责把多来源 memory 文件拼成单个 memory section

OpenCC 参照代码：

- `opencc/src/utils/claudemd.ts`
- `opencc/src/QueryEngine.ts:316`
- `opencc/src/utils/memoryFileDetection.ts`

### 2.7 git-status.ts

职责：

- 收集 git 状态上下文

定义内容：

- 当前阶段：`getGitStatus(workingDirectory)`
- 后续扩展：
  - `readBranchInfo()`
  - `readRecentCommits()`
  - `readWorkingTreeStatus()`

逻辑要求：

- 要保持 OpenCC 的 snapshot 语义：每轮或每次上下文构建时采集一次，不在 turn 中间动态变更
- 输出需要包含：
  - 当前分支
  - main branch
  - git user
  - status
  - recent commits
- status 需要保留 2k 截断语义
- 输出是一个完整文本块，交由 `system-context.ts` 放进 `gitStatus` 字段

OpenCC 参照代码：

- `opencc/src/context.ts:getGitStatus()`
- `opencc/src/utils/git.ts`

---

## 3. 内容组织建议

`context/` 适合以函数为主，不建议引入复杂 class。

推荐模式：

- 单来源收集函数
- 总装配函数
- prompt 渲染函数

原因：

- 这一层本质是纯组装逻辑
- 依赖显式传参，比隐藏状态更可控

---

## 4. 对 OpenCC 的对齐要求

Ark Code 的 `context/` 必须对齐 OpenCC 的上下文构成来源和拼装顺序。

可以调整的是：

- 文件拆分
- 返回结构
- 缓存组织方式

不能调整的是：

- prompt 的实际语义来源
- default / custom / append 的组合顺序
- CLAUDE.md、memory、日期、git 状态进入 prompt 的基本规则
