# runtime/skills 模块设计

## 0. 模块定位

`runtime/skills/` 负责 session 内 skill 的发现与执行接入。

skill 在 engine-core 中的角色是：

- 作为可调用能力加入工具平面
- 在 prompt / tool list 中作为可见能力存在
- 在调用时被分发到 skill runtime

---

## 1. 职责与要求

### 职责

- 发现 skill
- 组装 skill 元数据
- 把 skill 暴露给 tool registry
- 执行 skill 调用

### 要求

- skill 必须作为工具平面的一部分接入
- skill 发现和 skill 执行要分离
- builtin skill 与 repo skill 的发现逻辑要兼容

---

## 2. 下属文件规划

```text
skills/
  runtime.ts
  discovery.ts
```

### 2.1 runtime.ts

职责：

- 执行 skill 调用

定义内容：

- `runSkill()`
- `buildSkillExecutionContext()`
- `normalizeSkillResult()`

OpenCC 参照代码：

- `opencc/src/tools/SkillTool/SkillTool.tsx`
- `opencc/src/skills/*`

### 2.2 discovery.ts

职责：

- 发现和装配 skill 清单

定义内容：

- `discoverBundledSkills()`
- `discoverProjectSkills()`
- `listSkillsForSession()`

OpenCC 参照代码：

- `opencc/src/utils/skills.ts`
- `opencc/src/skills/bundled/*`
- `opencc/src/QueryEngine.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/skills` 要保留 OpenCC 中 skill 作为工具平面一部分出现的语义，不能把 skill 变成脱离 tool runtime 的独立旁路能力。
