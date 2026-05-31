# BRAND_PLACEHOLDERS.md

以下品牌迁移字段暂未确定，因此当前仓库中不应凭空猜测或伪造。

## 待补充字段

- 站点地址：暂无
- 卸载页 URL：暂无
- Chrome Web Store 地址：暂无
- Firefox/Gecko 扩展 ID：暂无

## 当前处理规则

- **站点地址**：公开文档中用占位说明替代，避免发布错误链接。
- **Chrome Web Store 地址**：公开文档中用占位说明替代，避免用户跳到旧商店页。
- **卸载页 URL**：`extension/background.js` 里的旧值暂时保留；清空会导致卸载反馈入口消失。
- **Firefox/Gecko 扩展 ID**：`extension/manifest.json` 里的旧值暂时保留；清空或伪造值可能影响 Firefox 打包/识别。

## 已确认新值

- 扩展显示名：`image2 prompt quicker`
- GitHub 仓库地址：`https://github.com/InvisibleQAQ/gpt-image-2-prompt-quicker`
- jsDelivr 前缀：`https://cdn.jsdelivr.net/gh/InvisibleQAQ/gpt-image-2-prompt-quicker@main/`

后续一旦这些空位有真实值，统一替换本文件和相关页面入口。