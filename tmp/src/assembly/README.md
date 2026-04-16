# engine-core/src/assembly

推理装配层。

## 目录映射

- `../context/`
- `../prompt/`
- `../model-loop/`

## 职责

- 动态上下文装配
- system prompt 与 request 编译
- 模型流式响应解释

## 说明

这一层决定当前轮模型看到什么、如何请求、如何解释输出。
