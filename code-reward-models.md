# code-reward-models.md

## 说明

这份文档整理的是我这次检索后确认过、且**有明确 Hugging Face 或 GitHub 开源地址**的 reward model / preference model。

### 判断口径

- **训练是否 pairwise**：训练阶段是否显式使用 preference pairs、Bradley-Terry、pairwise preference objective 等。
- **推理是否 pairwise**：推理阶段是否把**两个候选答案一起输入模型**直接比较；如果是**分别对单个候选打分再比较**，则记为“否”。
- **code-specific**：是否明确面向代码生成/代码评测训练，而不是通用文本 reward model。

## 结论先说

最关键的结论只有一条：

- **Themis-RM、Skywork-Reward-V2、CodeScaler、AceCodeRM** 都是“**训练用 pairwise 偏好数据**，但**推理时是 scalar / pointwise 打分**”的路线。
- 真正“**推理时也是 pairwise**”的开源模型，当前更常见的是 **PairRM**、**RLHFlow pair-preference-model** 这种**通用偏好模型**，不是主流的 code-specific RM。

## 模型表

| 模型 | 是否 code-specific | 训练是否 pairwise | 推理是否 pairwise | 开源地址 | 适合用途 |
|---|---|---|---|---|---|
| **Themis-RM 系列**（代表：Themis-RM-8B） | 是 | 是 | 否 | [HF: project-themis/Themis-RM-8B](https://huggingface.co/project-themis/Themis-RM-8B) / [GitHub: iNeil77/Themis](https://github.com/iNeil77/Themis) | 多语言代码候选重排、Best-of-N、按功能正确性/效率/安全性/可维护性做多维打分 |
| **Skywork-Reward-V2 系列**（代表：Qwen3-8B） | 否（通用 RM，可用于代码候选） | 是 | 否 | [HF: Skywork-Reward-V2-Qwen3-8B](https://huggingface.co/Skywork/Skywork-Reward-V2-Qwen3-8B) / [GitHub: Skywork-Reward-V2](https://github.com/SkyworkAI/Skywork-Reward-V2) | 通用 reward rerank、代码候选粗排、作为 code RM 初始化底座 |
| **CodeScaler 系列**（代表：CodeScaler-8B） | 是 | 是 | 否 | [HF: LARK-Lab/CodeScaler-8B](https://huggingface.co/LARK-Lab/CodeScaler-8B) / [GitHub: LARK-AI-Lab/CodeScaler](https://github.com/LARK-AI-Lab/CodeScaler) | execution-free 代码 reward、test-time scaling、代码 RL 训练中的 reward source |
| **AceCodeRM 系列**（代表：AceCodeRM-7B） | 是 | 是 | 否 | [HF: TIGER-Lab/AceCodeRM-7B](https://huggingface.co/TIGER-Lab/AceCodeRM-7B) / [GitHub: TIGER-AI-Lab/AceCoder](https://github.com/TIGER-AI-Lab/AceCoder) | 代码 RL / reward modeling、结合合成测试用例的代码质量评估 |
| **PairRM** | 否 | 是 | 是 | [HF: llm-blender/PairRM](https://huggingface.co/llm-blender/PairRM) / [GitHub: yuchenlin/LLM-Blender](https://github.com/yuchenlin/LLM-Blender) | 严格 pairwise rerank、两两比较候选答案、可迁移到代码场景做 judge |
| **RLHFlow pair-preference-model-LLaMA3-8B** | 否 | 是 | 是 | [HF: RLHFlow/pair-preference-model-LLaMA3-8B](https://huggingface.co/RLHFlow/pair-preference-model-LLaMA3-8B) / [GitHub: RLHFlow/RLHF-Reward-Modeling](https://github.com/RLHFlow/RLHF-Reward-Modeling) | pairwise judge、tournament ranking、给代码场景做二次适配的 pairwise baseline |

## 逐项备注

### 1. Themis-RM

- 官方仓库直接写的是 **scalar code reward models**。
- 训练数据来自 **Themis-CodePreference**，训练目标使用 **Bradley-Terry**。
- 这意味着它虽然吃的是 preference pairs，但推理不是“把两个候选一起丢进去比较”，而是**单候选打分后再比较分数**。
- 它的价值在于：**代码领域专用、覆盖多语言、多维度质量标准**。

### 2. Skywork-Reward-V2

- 这不是 code-specific RM，本质是**高质量通用 reward model**。
- 官方文档明确写了 **Bradley-Terry reward models**。
- 推理方式是标准 sequence classification / scalar reward 风格。
- 如果你做代码任务，它更适合作为：
  - 通用 reranker
  - code RM 的初始化底座
  - 对比基线

### 3. CodeScaler

- CodeScaler 是这批里非常接近“代码 test-time scaling 实战工具”的一个。
- 它是**代码专用**、**execution-free**、**训练用 pairwise 数据**，但推理仍然是**pointwise/scalar**。
- 和 Themis 的区别是，它更强调**在代码生成 test-time inference 里替代执行测试的效率价值**。

### 4. AceCodeRM

- AceCodeRM 依赖 AceCoder 那套自动合成测试用例的路线。
- 训练数据是 `AceCodePair-300K`，属于**代码专用偏好数据**。
- 推理示例仍然是单候选逐个打分，不是 strict pairwise inference。
- 它更像“**测试驱动 reward 建模**”的代码版实现。

### 5. PairRM

- PairRM 是你要找的“**真正 pairwise inference**”路线代表。
- 它的输入就是：**指令 + 候选 A + 候选 B**。
- 输出就是相对优劣/相对分数。
- 但问题也很明显：**它不是 code-specific**。
- 所以它适合做：
  - pairwise judge baseline
  - 两两淘汰/tournament ranking
  - 迁移到代码偏好数据再做适配

### 6. RLHFlow pair-preference-model

- 这是另一个明确的 **pairwise inference** 开源模型路线。
- 官方仓库明确说明：它接收 **prompt + two responses**，直接预测第一个回答被偏好的概率。
- 仍然不是 code-specific。
- 但如果你要自己做 **pairwise code RM**，它是个比 PairRM 更像“训练配方”的起点。

## 没放进主表的项

### RewardCode

我没有把 RewardCode 放进主表，不是因为它不重要，而是因为**这次检索里我没有确认到一个明确可用的官方 Hugging Face 模型页或 GitHub 权重/代码仓库页**；我只确认到了论文页：

- [OpenReview: RewardCode](https://openreview.net/forum?id=zpsYG8fYc8)

从论文内容看：

- 它是 **code-specific**；
- 训练里用了 **Pairwise-GRPO**；
- 但论文摘要明确写了 **conducts pointwise evaluation of solutions**；
- 所以即便把它纳入分类，它也更接近“**pairwise 训练 + pointwise 推理**”，不是 strict pairwise inference。

## 选型建议

### 如果你要的是“代码域效果优先”

优先看：

1. **Themis-RM**
2. **CodeScaler**
3. **AceCodeRM**
4. **Skywork-Reward-V2**（更适合作为通用底座/对照）

### 如果你要的是“严格 pairwise 推理”

优先看：

1. **PairRM**
2. **RLHFlow pair-preference-model**

### 如果你要自己做“pairwise code RM”

更现实的路线不是死找现成模型，而是：

- 用 **Themis / CodeScaler / AceCodeRM** 这类 code-specific 数据和任务定义，
- 结合 **PairRM / RLHFlow** 这种 pairwise inference 配方，
- 自己训练一个 code-specific pairwise judge。

## 参考来源

- [Themis GitHub](https://github.com/iNeil77/Themis)
- [Themis-RM-8B](https://huggingface.co/project-themis/Themis-RM-8B)
- [Themis-CodePreference](https://huggingface.co/datasets/project-themis/Themis-CodePreference)
- [Skywork-Reward-V2 GitHub](https://github.com/SkyworkAI/Skywork-Reward-V2)
- [Skywork-Reward-V2-Qwen3-8B](https://huggingface.co/Skywork/Skywork-Reward-V2-Qwen3-8B)
- [CodeScaler GitHub](https://github.com/LARK-AI-Lab/CodeScaler)
- [CodeScaler-8B](https://huggingface.co/LARK-Lab/CodeScaler-8B)
- [AceCoder GitHub](https://github.com/TIGER-AI-Lab/AceCoder)
- [AceCodeRM-7B](https://huggingface.co/TIGER-Lab/AceCodeRM-7B)
- [PairRM](https://huggingface.co/llm-blender/PairRM)
- [LLM-Blender GitHub](https://github.com/yuchenlin/LLM-Blender)
- [RLHFlow pair-preference-model-LLaMA3-8B](https://huggingface.co/RLHFlow/pair-preference-model-LLaMA3-8B)
- [RLHFlow Reward Modeling GitHub](https://github.com/RLHFlow/RLHF-Reward-Modeling)
- [RewardCode OpenReview](https://openreview.net/forum?id=zpsYG8fYc8)
