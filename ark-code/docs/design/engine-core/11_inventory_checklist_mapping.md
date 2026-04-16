# inventory 清单级映射

本文件把以下两份清单逐条映射到 `06_inventory_mapping.md`：

- `engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`

状态定义：

- **已覆盖**：`06_inventory_mapping.md` 中已有明确功能组，且覆盖到该条目的核心语义
- **部分覆盖**：`06_inventory_mapping.md` 已覆盖主能力组，但还没细化到该条目的完整子语义
- **未覆盖**：`06_inventory_mapping.md` 中还没有明确条目承接该检查项

---

## 1. 当前整体判断

经过本轮补充后，`06_inventory_mapping.md` 已经做到：

- 覆盖两个 inventory 的主功能组
- 覆盖两个 inventory 的主闭环阶段
- 为绝大多数 checklist 条目提供了直接承接的功能组

但仍然需要区分两件事：

1. **是否已经能找到对应功能组**
2. **是否已经把该条目拆到最细的实现语义**

当前状态是：

- 已经可以为 checklist 条目找到承接功能组
- 但仍有不少条目只达到“功能组级承接”，没有拆到实现语义级细粒度文档

所以本文件的最终结论仍然是：

> 已完成 checklist 级映射；未完成所有条目的细粒度语义拆分。

---

## 2. `99_gap_checklist.md` 映射结论

### 2.1 已覆盖到功能组层级

以下条目当前都已经能在 `06_inventory_mapping.md` 里找到明确承接组：

- query / session state machine
- model loop
- context / prompt
- selection / assembly / injection
- workbench 全部分组：shell / files / patch / search / process
- shell approval surface
- subagent / orchestration
- subagent supporting surfaces
- transcript / history / resume / recovery
- hooks / gates
- MCP runtime
- skills
- approval / permission
- memory / attachments / artifacts
- events / observability
- runtime waiting / continuation / output handoff
- 高风险项
- 需要谨慎分边界的部分
- 文档完整性核对

### 2.2 仍属于部分覆盖的典型条目

这些条目已经有承接组，但还没有在 `06_inventory_mapping.md` 中展开到足够细的子语义：

- max turns / token budget continuation
- prompt-too-long recovery
- max_output_tokens recovery
- agent listing 注入路径（prompt vs attachment）
- SkillTool forked prompt 组装
- MCP commands / resources / prompts merge 链
- read image / pdf / notebook
- code search 边界
- agent summary / progress aggregation
- Agent tool runtime
- worktree visibility / prompt exposure
- per-agent MCP
- multi-agent spawn surface
- RemoteAgentTask
- spawnMultiAgent
- agent summary / partial result extraction
- interrupted turn detection
- file history restore
- attribution restore
- todo restore
- context collapse state restore
- skill hook / frontmatter hook
- scope / policy filter
- transport model
- tools / prompts / resources load 的细项
- OAuth / XAA / official registry / Claude.ai connector / enterprise policy 细项
- channel notification / channel permission
- large output / binary artifact handling
- useManageMCPConnections integration surface
- REPL/runtime merge surface
- command adapter
- skill resource extraction
- resolveOnce / claim 多路竞态
- rules loader / parser
- mode 切换
- local interactive approval
- bridge remote approval
- channel approval relay
- coordinator / swarm worker approval
- classifier path
- nested memory injection
- current session memory injection
- queued command attachment
- approval event / MCP event / subagent event
- host boundary 的若干细分排除项
- user-triggered backgrounding / assistant auto-backgrounding
- stall watchdog / interactive prompt detection
- TaskOutputTool / Read handoff surface

### 2.3 当前仍未细化到明确条目的少量项目

这类项目现在已经有上位承接组，但还建议后续继续单列：

- speculative classifier with tool execution
- permission audit logging

当前它们已经可以挂到：
- `approval arbitration / classifier / audit`

所以从“有没有承接组”角度，已不再是完全未覆盖；但从“是否足够细”角度，仍然要继续细化。

---

## 3. `99_verification_matrix.md` 映射结论

### 3.1 已覆盖到功能组层级

以下主段落都已经在 `06_inventory_mapping.md` 中找到明确承接组：

- 入口 / 发现 / 筛选 / 激活
- 上下文 / Prompt / Request 装配
- 单轮执行 / Tool Round / Workbench
- 等待态 / 后台任务 / Continuation / 回流
- 横切机制核对
- Ark Code 实现验收标准

### 3.2 仍属于部分覆盖的典型条目

以下条目已经有承接组，但还没有细化到足够明确的 runtime 级子语义：

- meta prompt 与普通 prompt 可区分
- user prompt submit hooks 可在 query 前拦截
- plugin skills / builtin plugin skills / workflow commands 的细分来源
- availability requirement / `isCommandEnabled` 的过滤细节
- skills 按文件 identity 去重
- activated skills 刷新 command caches
- `allowedAgentTypes` 裁剪 agent pool
- required MCP servers 未真正有 tools 时阻止 agent 进入运行
- MCP tools / commands / resources 写入状态细节
- disabled / failed / pending / connected 状态影响可用 surface
- userContext / systemContext 作为 cache-safe prefix 的细节
- compact / resume 后 listing / delta resurfaced 细节
- tool-search / caller / advisor / media 等 API 后处理细节
- concurrency-safe / 非 concurrency-safe 的批次策略细节
- in-progress tool ids 维护细节
- tool 可在 assistant streaming 尚未结束时提前执行
- sibling error / pending discard 的处理细节
- foreground shell 的流式输出细节
- patch/edit 与 history/diagnostics/conditional skills 联动细节
- subagent / skill / MCP 作为高级执行接入点的细粒度执行链
- streaming fallback 清理与 execution error 一致性细节
- UI queue focus dialog 的 host 侧投影细节
- assistant auto-backgrounding 细节
- hook 先行解决 elicitation 与 result hooks 的细节
- shutdown / outer abort 打断 capacity wait 的细节
- consumed queued commands 清理细节

### 3.3 当前仍需继续细化的少量条目

这类条目现在已经有上位承接组，但建议后续单独拆条：

- force reconnect 路径存在
- UI 能根据 queue 决定当前 focus dialog
- consumed queued commands 会被清理

它们当前可分别挂到：
- `remote reconnect control detail`
- `host / UI queue focus and consumption cleanup`

因此从“有没有承接组”角度，也不再是完全未覆盖，但仍属于需要继续细化的条目。

---

## 4. 现在最准确的状态表述

现在可以比上一轮更准确地说：

- `06_inventory_mapping.md` 已经完成对两个 inventory 的**清单级功能承接**
- 绝大多数 checklist 条目已经可以映射到明确功能组
- 当前剩下的问题，主要不再是“有没有覆盖”，而是“有没有拆得足够细”

所以当前最准确的结论是：

> 已完成 checklist 级功能承接；未完成全部条目的细粒度语义拆分。

---

## 5. 下一步建议

如果继续做实，下一步不是再问“是否覆盖”，而是做：

1. 从本文件中挑出仍属“部分覆盖”的高风险条目
2. 决定哪些要继续补进 `06_inventory_mapping.md`
3. 其余需要保留歧义或待确认的，写入 `09_opencc_alignment_issues.md`

这样后续重新开始代码实现时，就不会再因为“来源不清”而走偏。 
