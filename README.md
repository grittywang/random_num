# 青春校园风随机数生成器

一个具有"青春校园风"视觉风格的随机数生成器，核心亮点是每位数字独立进行老虎机式滚动动画，逐位依次停止。

## 功能特性

- **随机数生成** — 点击"生成"按钮，按设定的位数和范围生成随机数
- **逐位滚动动画** — 每位数字从 "0" 开始快速跳动，先快后慢，逐位依次停止
- **复制到剪贴板** — 一键复制生成结果，带 Toast 提示反馈
- **调节位数** — 拖动滑块实时调整位数（1-20位），默认10位
- **调节范围** — 拖动"范围"滑块控制每位数字的可选范围（如0-6）
- **自适应布局** — 数字尽量一行显示，放不下自动换到第二行
- **离线可用** — 图标字体已下载至本地，无需联网

## 文件结构

```
260816/
├── index.html                  # 主页面（包含全部 CSS 和 JavaScript）
├── README.md                   # 本文件
└── icons/                      # 图标字体资源（Material Design Icons）
    ├── materialdesignicons.min.css
    └── fonts/
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

每位数字的滚动动画采用 JavaScript 驱动，而非 CSS `@keyframes`，以实现精确的逐位顺序控制：

1. 所有格子初始化显示 "0"
2. 第1位开始快速切换随机数字（初始间隔 30ms），跳动范围受"范围"滑块控制
3. 切换速度按 `delay = 30 × (step/55)^2.2` 递减，形成先快后慢的减速效果
4. 第1位停止后，第2位才开始跳动，依此类推
5. 每位停止时添加 `.done` 状态（绿色边框），跳动时添加 `.rolling` 状态（橙色边框）
6. 数字区域 `flex-wrap: wrap`，自动适配一行或两行显示

### 控制项

| 滑块 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| 位数 | 1-20 | 10 | 随机数的总位数 |
| 范围 | 1-9 | 9 | 每位数字的可选范围（如设为6 → 每位只能是0-6） |

两个滑块独立控制。"范围"设为 N 时，每位数字随机从 `0` 到 `N` 中选取。

### 视觉风格

| 元素 | 实现 |
|------|------|
| 配色 | 天蓝 `#4A90D9`、薄荷绿 `#7EC8A0`、暖橙 `#FF8A65`、薰衣草 `#B8A9E8` |
| 背景 | Canvas 绘制浮动的星星、纸飞机、书本、圆点 |
| 卡片 | `backdrop-filter: blur(10px)` 毛玻璃效果 + 大圆角 + 柔和阴影 |
| 响应式 | PC 和手机自适应，小屏幕数字格自动缩小，数字自动换行 |

### 图标

使用 [Material Design Icons](https://pictogrammers.com/library/mdi/) 字体图标：

- `mdi-dice-multiple` — 骰子图标（生成按钮 & 标题装饰）
- `mdi-content-copy` — 复制图标（复制按钮）

图标文件已下载至 `icons/` 目录，通过本地 CSS 引用，无需 CDN。

## 浏览器兼容性

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

依赖特性：`async/await`、`CSS Custom Properties`、`backdrop-filter`、`Clipboard API`（降级至 `execCommand`）
