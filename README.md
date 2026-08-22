# 青春校园风随机数生成器

一本"打开的笔记本"——所有交互都发生在一张方格纸上。不是模仿校园的网页，而是一张学生随手翻开的笔记本页面。

## 功能特性

- **随机数生成** — 点击"生成"按钮，按设定的位数和范围生成随机数
- **逐位滚动动画** — 每位数字从 "0" 开始快速跳动，先快后慢，逐位依次停止
- **复制到剪贴板** — 一键复制生成结果，便利贴风格 Toast 提示
- **调节位数** — 拖动滑块实时调整位数（1-20位），默认10位
- **调节范围** — 拖动"范围"滑块控制每位数字的可选范围（如0-6）
- **深色模式** — 右上角一键切换，护眼深蓝灰配色，偏好保存至 localStorage
- **今日祝福** — 每次加载页面弹出便利贴弹窗，随机显示100句校园风祝福语
- **底部广告** — 关闭祝福3秒后从底部弹出居中广告，点击可跳转外部链接
- **数据持久化** — 生成结果自动保存至 localStorage，刷新页面不丢失
- **浮动文具背景** — Canvas 绘制铅笔、橡皮、尺子、星星、纸飞机等校园元素
- **自适应布局** — 数字自动换行，PC 和手机均可良好显示
- **移动端优化** — 滑块手指离开范围后仍可继续拖动
- **离线可用** — 所有图标和字体已下载至本地，无需联网

## 文件结构

```
260816/
├── index.html                      # 主页面（HTML 结构 + CSS 样式）
├── script.js                       # JavaScript 逻辑（动画、交互、深色模式等）
├── ad_pic.png                      # 广告图片
├── README.md                       # 本文件
└── icons/                          # 本地图标资源
    ├── materialdesignicons.min.css # MDI 字体 CSS
    ├── sunny.svg                   # 太阳图标（亮色模式，蓝色）
    ├── sunny-dark.svg              # 太阳图标（深色模式，黄色）
    ├── night.svg                   # 月亮图标（亮色模式，蓝色）
    ├── night-dark.svg              # 月亮图标（深色模式，黄色）
    └── fonts/                      # MDI 字体文件
        ├── materialdesignicons-webfont.eot
        ├── materialdesignicons-webfont.ttf
        ├── materialdesignicons-webfont.woff
        └── materialdesignicons-webfont.woff2
```

## 使用方式

直接在浏览器中打开 `index.html` 即可运行，无需任何构建工具或服务器。

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

## 技术细节

### 动画实现

每位数字的滚动动画采用 JavaScript 驱动，以实现精确的逐位顺序控制：

1. 所有格子初始化显示 "0"
2. 第1位开始快速切换随机数字（初始间隔 30ms），跳动范围受"范围"滑块控制
3. 切换速度按 `delay = 30 × (step/55)^2.2` 递减，形成先快后慢的减速效果
4. 第1位停止后，第2位才开始跳动，依此类推
5. 每位停止时添加 `.done` 状态（绿色边框），跳动时添加 `.rolling` 状态（橙色边框）

### 骰子图标旋转

使用 Web Animations API（`element.animate()`）实现每次点击都可靠触发旋转动画，不依赖 CSS class 切换：

```javascript
$headerIcon.animate([
  { transform: 'rotate(0deg) scale(1)' },
  { transform: 'rotate(360deg) scale(1.15)' },
  { transform: 'rotate(360deg) scale(1)' }
], { duration: 1200, easing: 'cubic-bezier(.34,1.56,.64,1)' });
```

### 深色模式

- 通过 `.dark` class 切换，CSS 变量全局替换配色
- 深色配色使用深蓝灰（`#1a1d23`）而非纯黑，护眼不刺激
- 偏好保存至 `localStorage('rng_theme')`，首次访问跟随系统 `prefers-color-scheme`
- 所有颜色过渡 `0.4s`，切换平滑
- 图标使用 4 个 SVG 文件（亮色/暗色 × 太阳/月亮），通过 CSS `display` 切换

### 今日祝福便利贴

- 100 句校园风祝福语，涵盖学习、考试、青春、生活、励志、幽默
- 每次加载页面延迟 400ms 弹出，便利贴风格：暖黄纸张 + 顶部胶带 + 底部撕边
- 红色边框关闭按钮（SVG 叉号），点击遮罩也可关闭
- 深色模式自动适配深色纸张

### 底部广告

- 关闭祝福便利贴 3 秒后从底部弹出，居中显示，宽度约页面 2/3
- 圆角卡片样式，图片上叠加"点击获取更多福利"加粗白字黑边文字
- 方形灰色关闭按钮（右上角），只能通过点击叉号关闭
- 点击广告图片跳转外部链接（新标签页打开）
- 距离页面底部 44px，不遮挡版权声明

### 移动端滑块修复

移动端手指拖动滑块时，若手指移出滑块范围，默认浏览器行为会中断拖动。修复方案：

- `touchstart` 在滑块上触发时设置 `active` 标记
- `touchmove` 监听在 `document` 上（而非滑块），只要 `active` 为 true 就持续更新值
- `touchend` / `touchcancel` 重置标记
- `touchmove` 使用 `{passive:false}` 并 `preventDefault()` 阻止页面滚动

### 数据持久化

| 数据 | 存储键 | 存储方式 | 说明 |
|------|--------|----------|------|
| 生成结果 | `rng_last_result` | localStorage | 刷新页面仍显示上次结果 |
| 主题偏好 | `rng_theme` | localStorage | 亮色/深色模式选择 |

### 控制项

| 滑块 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| 位数 | 1-20 | 10 | 随机数的总位数 |
| 范围 | 1-9 | 9 | 每位数字的可选范围（如设为6 → 每位只能是0-6） |

两个滑块独立控制。"范围"设为 N 时，每位数字随机从 `0` 到 `N` 中选取。

### 视觉风格

| 元素 | 实现 |
|------|------|
| 背景 | Canvas 绘制方格网线 + 浮动文具（铅笔、橡皮、尺子、星星、纸飞机、爱心、音符、彩色圆点） |
| 卡片 | 白色笔记本页面，左侧红色装订线，顶部装订环装饰 |
| 数字格 | 图纸方格风格，厚底边框 + 右边框，跳动时高亮黄底 |
| 按钮 | 贴纸风格，微倾斜 + 硬投影，按下时回弹 |
| Toast | 便利贴风格，微倾斜 + 黄色背景 |
| 便利贴弹窗 | 暖黄纸张 + 顶部蓝色胶带 + 底部撕边锯齿 |
| 底部广告 | 居中圆角卡片，方形灰色关闭按钮，图片叠加文字 |
| 深色模式 | 深蓝灰背景 `#1a1d23`，护眼配色 |
| 配色 | 墨水蓝 `#2B5EA7`、铅笔灰 `#4A4A4A`、荧光黄 `#FFE066`、尺子绿 `#5B9A4F`、红笔 `#D94F4F` |
| 响应式 | PC 和手机自适应，小屏幕数字格自动缩小 |

### 图标

- **骰子/复制** — Material Design Icons 字体图标，通过本地 CSS 引用
- **太阳/月亮** — SVG 矢量图标，保存在 `icons/` 目录，4 个文件分别对应亮色/暗色模式

## 浏览器兼容性

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

依赖特性：`async/await`、`CSS Custom Properties`、`Web Animations API`、`Canvas 2D`、`Clipboard API`（降级至 `execCommand`）、`sessionStorage`、`localStorage`

## 项目结构说明

- **`index.html`** — 纯 HTML 结构 + CSS 样式（内嵌 `<style>`）
- **`script.js`** — 纯 JavaScript 逻辑，通过 `<script src="script.js">` 引用
- **`ad_pic.png`** — 底部广告图片
- **`icons/`** — 所有图标资源（MDI 字体 + SVG 矢量图标），完全离线可用

HTML 和 JS 分离后，修改样式只需编辑 `index.html`，修改交互逻辑只需编辑 `script.js`，互不干扰。
