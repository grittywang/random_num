/* ============ Config ============ */
const ROLL_STEPS = 55;
const BASE_MS = 30;
const POWER = 2.2;
const STORAGE_KEY = 'rng_last_result';

/* ============ State ============ */
let digitCount = 10;
let maxDigit = 9;
let isAnimating = false;
let currentResult = '';

/* ============ DOM ============ */
const $digits = document.getElementById('digits');
const $range = document.getElementById('digitCount');
const $val = document.getElementById('digitVal');
const $maxRange = document.getElementById('maxRange');
const $maxValEl = document.getElementById('maxVal');
const $generate = document.getElementById('generateBtn');
const $copy = document.getElementById('copyBtn');
const $toast = document.getElementById('toast');
const $resultArea = document.getElementById('resultArea');
const $headerIcon = document.getElementById('headerIcon');

/* ============ Helpers ============ */
function randDigit() { return Math.floor(Math.random() * (maxDigit + 1)); }

function saveResult() {
  try { localStorage.setItem(STORAGE_KEY, currentResult); } catch (e) { }
}
function loadResult() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

/* 将已有结果直接显示到格子里（无动画） */
function displayResult(str) {
  currentResult = str;
  digitCount = str.length;
  $range.value = digitCount;
  $val.textContent = digitCount;
  const digits = str.split('').map(Number);
  buildSlots();
  const slots = $digits.querySelectorAll('.digit-slot');
  slots.forEach((slot, i) => {
    slot.querySelector('.digit-display').textContent = digits[i];
    slot.classList.add('done');
  });
  $resultArea.classList.add('active');
}

function createSlot() {
  const slot = document.createElement('div');
  slot.className = 'digit-slot';
  slot.innerHTML = '<div class="digit-display">0</div>';
  return slot;
}

function buildSlots() {
  $digits.innerHTML = '';
  for (let i = 0; i < digitCount; i++) {
    $digits.appendChild(createSlot());
  }
}

/* ============ Sequential Animation ============ */
function animateSlot(slot, target) {
  return new Promise(resolve => {
    const display = slot.querySelector('.digit-display');
    let step = 0;
    slot.classList.add('rolling');

    function tick() {
      if (step >= ROLL_STEPS) {
        display.textContent = target;
        slot.classList.remove('rolling');
        slot.classList.add('done');
        resolve();
        return;
      }
      display.textContent = randDigit();
      step++;
      const delay = BASE_MS * Math.pow(step / ROLL_STEPS, POWER);
      setTimeout(tick, delay);
    }
    tick();
  });
}

/* ============ Generate ============ */
async function generate() {
  if (isAnimating) return;
  isAnimating = true;
  $generate.style.opacity = '.6';
  $generate.style.pointerEvents = 'none';

  // 用 Web Animations API 每次点击都触发旋转
  $headerIcon.animate([
    { transform: 'rotate(0deg) scale(1)' },
    { transform: 'rotate(360deg) scale(1.15)' },
    { transform: 'rotate(360deg) scale(1)' }
  ], {
    duration: 1200,
    easing: 'cubic-bezier(.34,1.56,.64,1)'
  });

  $resultArea.classList.add('active');

  const res = Array.from({ length: digitCount }, randDigit);
  currentResult = res.join('');

  buildSlots();

  const slots = $digits.querySelectorAll('.digit-slot');
  for (let i = 0; i < slots.length; i++) {
    await animateSlot(slots[i], res[i]);
  }

  isAnimating = false;
  $generate.style.opacity = '1';
  $generate.style.pointerEvents = 'auto';
  saveResult();
}

/* ============ Copy ============ */
function copyResult() {
  if (!currentResult) { showToast('先生成一个数字吧~'); return; }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentResult).then(() => showToast('复制成功!'));
  } else {
    const t = document.createElement('textarea');
    t.value = currentResult; t.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(t); t.select();
    document.execCommand('copy'); t.remove();
    showToast('复制成功!');
  }
}

let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  $toast.textContent = msg;
  $toast.classList.add('show');
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2000);
}

/* ================================================
   Mobile Slider Fix — 手指离开滑块范围仍可拖动
   在 document 上监听 touchmove/touchend，
   只要 touchstart 在滑块上开始，就持续更新值。
   ================================================ */
function enableFreeDrag(slider) {
  let active = false;

  function onStart(e) {
    active = true;
    sync(e);
  }
  function onMove(e) {
    if (!active) return;
    e.preventDefault();        // 阻止页面滚动
    sync(e);
  }
  function onEnd() { active = false; }

  function sync(e) {
    const touch = e.touches ? e.touches[0] : e;
    const rect = slider.getBoundingClientRect();
    const ratio = (touch.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    const min = +slider.min, max = +slider.max;
    const step = +(slider.step || 1);
    let val = min + clamped * (max - min);
    val = Math.round(val / step) * step;
    val = Math.max(min, Math.min(max, val));
    if (slider.value !== String(val)) {
      slider.value = val;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  slider.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd, { passive: true });
  document.addEventListener('touchcancel', onEnd, { passive: true });
}

/* ============ Slider Events ============ */
$range.addEventListener('input', () => {
  digitCount = +$range.value;
  $val.textContent = digitCount;
});

$maxRange.addEventListener('input', () => {
  maxDigit = +$maxRange.value;
  $maxValEl.textContent = '0-' + maxDigit;
});

/* ============ Init ============ */
$generate.addEventListener('click', generate);
$copy.addEventListener('click', copyResult);
enableFreeDrag($range);
enableFreeDrag($maxRange);

// 页面加载时恢复上次结果
const saved = loadResult();
if (saved) {
  displayResult(saved);
} else {
  buildSlots();
}

/* ============ Dark Mode ============ */
const THEME_KEY = 'rng_theme';
const $themeToggle = document.getElementById('themeToggle');

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
}

// 初始化主题
const savedTheme = localStorage.getItem(THEME_KEY);
const prefersDark = savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme:dark)').matches);
applyTheme(prefersDark);

$themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
});

/* ============ 今日祝福便利贴 ============ */
const BLESSINGS = [
  '今天也要元气满满哦！',
  '加油，你比想象中更优秀！',
  '愿所有努力都不被辜负~',
  '今天的你闪闪发光！',
  '好运正在路上，稍等一下下~',
  '保持热爱，奔赴山海！',
  '每一天都是新的开始~',
  '你值得所有美好的事物！',
  '相信自己，你可以的！',
  '今天的小目标：开心！',
  '努力的人运气不会太差~',
  '你在发光，自己却不知道~',
  '所有的幸运，都是努力埋下的伏笔。',
  '慢慢来，比较快。',
  '今天不学习，明天变垃圾（bushi）',
  '你的坚持，终将美好。',
  '知识改变命运，努力成就未来！',
  '好好睡觉，天天向上~',
  '今天的作业写完了吗？（没写完别写了）',
  '愿你所求皆所愿，所行化坦途。',
  '把每天当作最后一天来珍惜~',
  '你现在的努力，是未来的底气。',
  '生活明朗，万物可爱，未来可期！',
  '别怕，星星也在努力发光呢。',
  '今天的风好温柔，像极了好运的味道。',
  '你笑起来真好看，像春天的花一样~',
  '做自己的太阳，不需要借谁的光。',
  '世界那么大，你一定要去看看！',
  '今天的咖啡格外好喝（如果有的话...）。',
  '困难都是纸老虎，一戳就破~',
  '你已经很棒了，记得夸夸自己！',
  '每天进步一点点，就是最好的状态。',
  '好事总是发生在下一个转弯~',
  '今天适合学习，也适合发呆。',
  '你的笑容是最好的正能量！',
  '不管几岁，快乐万岁！',
  '今天也要好好吃饭哦~',
  '人生是旷野，不是轨道。',
  '每一次选择都是一次冒险，勇敢点！',
  '你不是一个人在战斗~',
  '今天不想做的事，明天也不会想做。',
  '种一棵树最好的时间是十年前，其次是现在。',
  '不完美才是真实的完美。',
  '你比自己想象的更勇敢。',
  '今天也要做个温柔的人~',
  '失败不可怕，可怕的是不敢再试。',
  '你的潜力远超你的想象！',
  '今天宜：学习、运动、早睡。',
  '今天的你，是明天的回忆，好好过~',
  '没有白走的路，每一步都算数。',
  '抬头看看天空，心情会好一点~',
  '你值得被世界温柔以待。',
  '只要方向对了，就不怕路远。',
  '今天的努力是为了明天的选择权。',
  '永远不要小看一个有梦想的人！',
  '人生没有彩排，每天都是现场直播。',
  '你的善良，终会化为好运~',
  '今天也要记得微笑！',
  '你走过的路，每一步都算数。',
  '梦想还是要有的，万一实现了呢~',
  '今天适合努力，也适合被爱。',
  '你的存在本身就是一个奇迹。',
  '再坚持一下，曙光就在前方~',
  '你已经走了很远的路，别放弃！',
  '今天也是充满可能性的一天！',
  '生活不会辜负每一个努力的人。',
  '你想要的，都在路上了~',
  '做一个温暖的人，不求大富大贵，只求生活简单快乐。',
  '今天不卷了，明天再说（bushi）',
  '你的未来藏在你现在的努力里。',
  '累了就休息，没什么大不了的~',
  '你是最特别的存在，无人替代。',
  '今天的幸运数字会给你带来好运！',
  '别忘了，你也是别人的星星~',
  '学不死就往死里学（开玩笑的，注意身体）',
  '人生就像心电图，一帆风顺就挂了~',
  '你比昨天的自己更厉害了！',
  '今天适合许愿，万一灵了呢~',
  '你的努力终将不期而遇~',
  '今天的小确幸：你还活着，真好！',
  '不要着急，好事需要时间。',
  '你的笑容能治愈一切不开心~',
  '今天也要做一个有温度的人。',
  '努力的意义是让未来的自己感谢现在。',
  '你值得世间一切美好~',
  '今天不emo，今天要加油！',
  '你的故事还长，别急着写结局。',
  '今天适合做白日梦（！适度）~',
  '你已经做得很好了，真的！',
  '生活就像骑自行车，想保持平衡就得往前走。',
  '今天也要好好爱自己~',
  '你不是懒，你只是需要休息。',
  '未来可期，不负韶华！',
  '你的坚持，终将美好~',
  '今天也是值得记录的一天！',
  '别担心，该来的都在路上了。',
  '你已经是最好的自己了~',
  '今天适合重新出发！',
  '你的努力不会白费，时间会证明一切~',
  '做自己喜欢的事，让喜欢的事有价值。'
];

const STICKY_KEY = 'rng_sticky_closed';
const $stickyOverlay = document.getElementById('stickyOverlay');
const $stickyText = document.getElementById('stickyText');
const $stickyClose = document.getElementById('stickyClose');

function showSticky() {
  // 随机选一句祝福
  const idx = Math.floor(Math.random() * BLESSINGS.length);
  $stickyText.textContent = BLESSINGS[idx];
  // 延迟一点显示，等页面渲染完
  setTimeout(() => $stickyOverlay.classList.add('show'), 400);
}

function hideSticky() {
  $stickyOverlay.classList.remove('show');
  sessionStorage.setItem(STICKY_KEY, '1');
}

$stickyClose.addEventListener('click', hideSticky);
$stickyOverlay.addEventListener('click', (e) => {
  if (e.target === $stickyOverlay) hideSticky();
});

// // 首次访问显示，本次会话关闭后不再显示
// if (!sessionStorage.getItem(STICKY_KEY)) {
//   showSticky();
// }

// 每次刷新均会显示祝福语
showSticky();

/* ================================================
   浮动文具背景 — Canvas 绘制
   ================================================ */
(function () {
  const c = document.getElementById('bgCanvas');
  const ctx = c.getContext('2d');
  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * DPR; c.height = H * DPR;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  /* ---- 文具定义 ---- */
  const ITEMS = [];

  // 铅笔
  function drawPencil(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    // 笔身
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(-s * 1.2, -s * .15, s * 2.4, s * .3);
    // 笔尖
    ctx.beginPath();
    ctx.moveTo(s * 1.2, -s * .15);
    ctx.lineTo(s * 1.6, 0);
    ctx.lineTo(s * 1.2, s * .15);
    ctx.closePath();
    ctx.fillStyle = '#F5C563';
    ctx.fill();
    // 笔芯尖
    ctx.beginPath();
    ctx.moveTo(s * 1.5, -s * .04);
    ctx.lineTo(s * 1.7, 0);
    ctx.lineTo(s * 1.5, s * .04);
    ctx.closePath();
    ctx.fillStyle = '#4A4A4A';
    ctx.fill();
    // 橡皮头
    ctx.fillStyle = '#FFB5B5';
    ctx.fillRect(-s * 1.4, -s * .15, s * .25, s * .3);
    // 金属箍
    ctx.fillStyle = '#ccc';
    ctx.fillRect(-s * 1.2, -s * .15, s * .08, s * .3);
    ctx.restore();
  }

  // 橡皮
  function drawEraser(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const w = s * 1.6, h = s * .7;
    // 主体
    ctx.fillStyle = '#FFB5B5';
    roundRect(ctx, -w / 2, -h / 2, w, h, s * .12);
    ctx.fill();
    // 包装纸
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w / 2 + s * .1, -h / 2, w * .4, h);
    // 文字线
    ctx.strokeStyle = '#e88';
    ctx.lineWidth = s * .04;
    ctx.beginPath();
    ctx.moveTo(-w * .15, 0);
    ctx.lineTo(w * .3, 0);
    ctx.stroke();
    ctx.restore();
  }

  // 尺子
  function drawRuler(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const w = s * 2.8, h = s * .35;
    // 尺身
    ctx.fillStyle = '#A8D8A8';
    roundRect(ctx, -w / 2, -h / 2, w, h, s * .05);
    ctx.fill();
    // 刻度线
    ctx.strokeStyle = '#5B9A4F';
    ctx.lineWidth = s * .03;
    for (let i = 0; i < 8; i++) {
      const lx = -w / 2 + w * .08 + (w * .84 / 7) * i;
      const len = i % 2 === 0 ? h * .35 : h * .2;
      ctx.beginPath();
      ctx.moveTo(lx, -h / 2);
      ctx.lineTo(lx, -h / 2 + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 星星
  function drawStar(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const r = s * .5, ri = r * .4, pts = 5;
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const rad = i % 2 === 0 ? r : ri;
      const a = (i * Math.PI / pts) - Math.PI / 2;
      i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
        : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = '#FFE066';
    ctx.fill();
    ctx.strokeStyle = '#E6C84A';
    ctx.lineWidth = s * .04;
    ctx.stroke();
    ctx.restore();
  }

  // 纸飞机
  function drawPlane(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const r = s * .7;
    ctx.beginPath();
    ctx.moveTo(-r, r * .3);
    ctx.lineTo(r, 0);
    ctx.lineTo(-r, -r * .3);
    ctx.closePath();
    ctx.fillStyle = '#E3F2FD';
    ctx.fill();
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = s * .04;
    ctx.stroke();
    // 尾迹
    ctx.beginPath();
    ctx.moveTo(-r, r * .3);
    ctx.lineTo(-r * 1.5, r * .6);
    ctx.moveTo(-r, -r * .3);
    ctx.lineTo(-r * 1.5, -r * .6);
    ctx.strokeStyle = '#BBDEFB';
    ctx.lineWidth = s * .03;
    ctx.stroke();
    ctx.restore();
  }

  // 爱心
  function drawHeart(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const r = s * .3;
    ctx.beginPath();
    ctx.moveTo(0, r * .6);
    ctx.bezierCurveTo(-r * 1.5, -r * .2, -r * .6, -r * 1.4, 0, -r * .6);
    ctx.bezierCurveTo(r * .6, -r * 1.4, r * 1.5, -r * .2, 0, r * .6);
    ctx.closePath();
    ctx.fillStyle = '#FF8A80';
    ctx.fill();
    ctx.restore();
  }

  // 音符
  function drawNote(x, y, s, rot, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const r = s * .22;
    // 符头
    ctx.beginPath();
    ctx.ellipse(0, r * 1.2, r, r * .7, -.3, 0, Math.PI * 2);
    ctx.fillStyle = '#7E57C2';
    ctx.fill();
    // 符杆
    ctx.strokeStyle = '#7E57C2';
    ctx.lineWidth = s * .06;
    ctx.beginPath();
    ctx.moveTo(r * .7, r * 1.1);
    ctx.lineTo(r * .7, -r * 2.5);
    ctx.stroke();
    // 符尾
    ctx.beginPath();
    ctx.moveTo(r * .7, -r * 2.5);
    ctx.quadraticCurveTo(r * 1.6, -r * 1.8, r * .7, -r * .8);
    ctx.strokeStyle = '#7E57C2';
    ctx.lineWidth = s * .05;
    ctx.stroke();
    ctx.restore();
  }

  // 圆形彩色贴纸
  const DOT_COLORS = ['#FF8A65', '#81D4FA', '#A5D6A7', '#FFD54F', '#F48FB1'];
  function drawDot(x, y, s, rot, alpha, item) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, s * .3, 0, Math.PI * 2);
    ctx.fillStyle = DOT_COLORS[item.colorIdx % DOT_COLORS.length];
    ctx.fill();
    ctx.restore();
  }

  // 辅助：圆角矩形
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const DRAWERS = [drawPencil, drawEraser, drawRuler, drawStar, drawPlane, drawHeart, drawNote, drawDot];
  const COLORS_STR = ['#FFD54F', '#FFB5B5', '#A8D8A8', '#FFE066', '#90CAF9', '#FF8A80', '#7E57C2', '#FF8A65'];

  // 生成浮动元素
  for (let i = 0; i < 22; i++) {
    const typeIdx = i % DRAWERS.length;
    ITEMS.push({
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      s: 14 + Math.random() * 22,       // 大小
      rot: Math.random() * Math.PI * 2, // 初始旋转
      rotV: (Math.random() - .5) * .015, // 旋转速度
      vx: (Math.random() - .5) * .3,
      vy: -.15 - Math.random() * .4,     // 向上漂
      phase: Math.random() * Math.PI * 2,
      alpha: .3 + Math.random() * .35,
      draw: DRAWERS[typeIdx],
      colorIdx: Math.floor(Math.random() * 5)
    });
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // 画网格线（和 body 背景同一层，消除闪烁）
    const isDark = document.body.classList.contains('dark');
    ctx.strokeStyle = isDark ? 'rgba(60,66,80,.4)' : 'rgba(200,224,244,.35)';
    ctx.lineWidth = 1;
    const gap = 24;
    ctx.beginPath();
    for (let gx = 0; gx <= W; gx += gap) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (let gy = 0; gy <= H; gy += gap) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();

    const t = performance.now() * .001;
    ITEMS.forEach(item => {
      item.x += item.vx + Math.sin(t * .8 + item.phase) * .2;
      item.y += item.vy;
      item.rot += item.rotV;
      // 循环
      if (item.y < -50) { item.y = H + 50; item.x = Math.random() * W; }
      if (item.x < -50) item.x = W + 50;
      if (item.x > W + 50) item.x = -50;
      const drawAlpha = isDark ? Math.min(item.alpha + .2, .85) : item.alpha;
      item.draw(item.x, item.y, item.s, item.rot, drawAlpha, item);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
})();
