# packages: subagent / skills

## 1. `subagent/`

### 目标

负责 agent runtime、fork、resume、handoff、teammate 支撑链。

### 职责

- agent runtime
- forked subagent
- resumed subagent
- handoff / SendMessage semantics
- per-agent MCP
- per-agent tools
- sidechain transcript
- LocalAgentTask / RemoteAgentTask bridge
- teammate mailbox support

### 建议文件

```text
subagent/
  runtime.ts
  fork.ts
  resume.ts
  handoff.ts
  context.ts
  transcript.ts
  mailbox.ts
  task_bridge.ts
```

## 2. `skills/`

### 目标

负责 skill 的发现、激活、列表装配、执行与资源管理。

### 职责

- managed/user/project/additional/legacy skills
- bundled skills
- MCP skills
- conditional activation
- skill listing budget
- skill runtime
- skill resource extraction
- skill hooks

### 建议文件

```text
skills/
  registry.ts
  loader.ts
  activation.ts
  listing.ts
  runtime.ts
  bundled.ts
  mcp_skills.ts
  hooks.ts
```

## 3. 关键关系

- `subagent/` 负责 agent 形态的独立执行闭环
- `skills/` 负责 skill 形态的发现与执行入口
- skill runtime 在很多场景下通过 forked subagent 完成执行

## 4. 设计要求

- sidechain transcript 必须显式建模
- handoff 必须是正式协议面，不依赖临时字符串拼装
- conditional skill activation 必须保留
- skill listing 与 skill execution 必须分层：一个负责发现，一个负责实际执行
