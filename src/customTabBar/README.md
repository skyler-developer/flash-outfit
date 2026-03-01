# 自定义 TabBar 说明

## 当前实现方式（为何用全局样式）

本项目采用「在每个 tab 页里手动挂载 `<CustomTabBar />」的方式，而不是微信/Taro 官方的「约定目录 + 框架自动注入」方式。

在这种前提下：

- TabBar 组件会被打成 **common 公共 chunk**（`common.js`），样式会进 **common.wxss**
- 微信小程序**不会**自动把 `common.wxss` 引入到各个页面，导致 TabBar 的 CSS Modules 样式不生效
- 因此采用**全局样式**：在 `app.scss` 中引入 `tabBar.global.scss`，组件内使用固定类名（如 `custom-tab-bar`），保证所有 tab 页都能加载到样式

这是**在「手动挂载」前提下的一种稳妥、推荐做法**。

---

## 官方推荐方式（约定目录 + 框架注入）

微信与 Taro 文档中的推荐做法是使用**约定目录名**，由框架自动注入 TabBar，而不是在页面里手写组件。

### 1. 目录与命名

- 在 `src` 下建立目录：**`custom-tab-bar`**（必须是这个名字，kebab-case）
- 与 `pages` 同级，例如：
  ```
  src/
  ├── pages/
  ├── custom-tab-bar/   ← 约定名称，框架会识别
  │   ├── index.jsx (或 .tsx / .vue)
  │   ├── index.config.ts (可选)
  │   └── index.module.scss (或 .wxss)
  └── app.config.ts
  ```

### 2. 配置

- 在 `app.config.ts` 中设置 `tabBar.custom: true`（本项目已配置）
- 各 tab 页或 `app.json` 中声明 `usingComponents`（按 Taro 文档要求）

### 3. 使用方式

- **不需要**在任何页面里写 `<CustomTabBar />`
- 框架会根据 `custom: true` 和 `custom-tab-bar` 目录，**自动在 tab 页底部挂载**该组件
- 每个 tab 页会加载 **custom-tab-bar 自己的 wxss**，不会出现「样式在 common.wxss 里导致不生效」的问题

### 4. 选中态

- 在页面中通过 **`getTabBar()`** 获取当前页的 TabBar 实例，再调用 `setData` 或对应方法更新选中态
- 若用 React，可配合 Zustand/Redux 等做跨页状态（与当前项目类似）

---

## 两种方式对比

| 项目         | 当前方式（手动挂载 + 全局样式） | 官方方式（custom-tab-bar 约定目录） |
|--------------|----------------------------------|-------------------------------------|
| 目录名       | `customTabBar`（自定）           | 必须为 `custom-tab-bar`             |
| 是否在页面写组件 | 每个 tab 页都要写 `<CustomTabBar />` | 不需要，框架自动注入                 |
| 样式         | 需放在 `app.scss` 等全局样式里   | 用组件自己的 wxss，随组件加载       |
| 状态         | 用 Zustand 等（当前做法）       | 可用 getTabBar() + setData 或状态库 |
| 适用场景     | 已有「手动挂载」结构时          | 新项目或愿意按官方约定改造时        |

---

## 总结

- **当前做法**：在「手动挂载 TabBar」的前提下，用 **app 全局样式 + 固定类名** 解决 common.wxss 不加载的问题，是**合理且推荐**的解决方式。
- **若要完全贴合官方**：可把目录改为 `custom-tab-bar`，去掉各页的 `<CustomTabBar />`，由框架自动注入，并沿用或迁移现有 Zustand 状态逻辑；样式即可使用组件自身的 CSS Modules，无需再依赖 app 全局样式。
