/* ══════════════════════════════════════════════
   ✏️ 个人信息都在这里改，改完保存刷新即可
   ══════════════════════════════════════════════ */

// 打字机轮播的句子（想加几句都行）
const TYPE_LINES = [
  '追电竞的低能量人士 ⚡',
  'AI绘画 · Vibe coding 玩家中',
  '健身，正在尝试 💪',
  '欢迎交流，一同进步 ✦',
];

// 连戳头像 5 次后弹出的搞怪文案（按顺序循环）
const AVATAR_LINES = [
  '哎哟！被你发现了 🙈',
  '再戳要生气啦（并不）😤',
  '哈哈哈哈好痒 😂',
  '你戳我与把我喂饱何异 🍪',
  '好了好了，元气已充满 ⚡',
];

// 彩蛋用的 emoji
const BURST_EMOJIS = ['🍊', '✨', '🍋', '⭐', '🍪', '💫', '🌟', '🧡'];
const RAIN_EMOJIS  = ['🍊', '✨', '⭐', '🍋', '💛', '🧡', '🌈'];

// 微信号（微信按钮点了会复制这个）
const WECHAT_ID = 'Anson-Fract-Creat';

/* ══════════════ 工具 ══════════════ */
const $ = (sel) => document.querySelector(sel);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

let toastTimer = null;
function showToast(text, ms = 2200) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ══════════════ 1. 打字机 ══════════════ */
function typewriter() {
  const el = $('#typewriter');
  let line = 0, char = 0, deleting = false;

  function tick() {
    const text = TYPE_LINES[line];
    char += deleting ? -1 : 1;
    el.textContent = text.slice(0, char);

    let delay = deleting ? 38 : 92;           // 删得快、打得慢
    if (!deleting && char === text.length) {   // 打完整句 → 停顿后开始删
      delay = 1700;
      deleting = true;
    } else if (deleting && char === 0) {       // 删完 → 下一句
      deleting = false;
      line = (line + 1) % TYPE_LINES.length;
      delay = 420;
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* ══════════════ 2. 滚动入场动画 ══════════════ */
function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target); // 只播一次
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* ══════════════ 3. 鼠标拖尾（泡泡 + 小星星） ══════════════ */
function mouseTrail() {
  // 触屏设备或用户要求减少动效时不开，省性能
  if (isTouch || reducedMotion) return;

  const canvas = $('#trail-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
  }
  resize();
  addEventListener('resize', resize);

  const COLORS = ['#ff8a3d', '#ffc93d', '#ff9fb2', '#6fd3ac', '#ffb54d'];
  const particles = [];
  let lastX = null, lastY = null, carry = 0;

  addEventListener('pointermove', (e) => {
    if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
    // 累计移动距离，每移动 ~26px 掉一个粒子（太密会卡）
    carry += Math.hypot(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY;
    while (carry > 26) {
      carry -= 26;
      particles.push({
        x: lastX * dpr,
        y: lastY * dpr,
        r: (4 + Math.random() * 5) * dpr,
        life: 1,
        vx: (Math.random() - 0.5) * 0.8 * dpr,
        vy: (-0.5 - Math.random() * 0.7) * dpr, // 缓缓上飘
        color: COLORS[(Math.random() * COLORS.length) | 0],
        star: Math.random() < 0.25,             // 四分之一概率是星星
        rot: Math.random() * Math.PI,
      });
      if (particles.length > 90) particles.shift();
    }
  });

  function drawStar(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -p.r);
      ctx.lineTo(p.r * 0.28, -p.r * 0.28);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.022;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      if (p.star) {
        drawStar(p);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  })();
}

/* ══════════════ 4. 头像彩蛋：连戳 5 次 ══════════════ */
function avatarEasterEgg() {
  const avatar = $('#avatar');
  let clicks = 0, timer = null;

  // 从某个点向外喷一圈 emoji 彩带
  function burst(x, y) {
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'burst-emoji';
      s.textContent = BURST_EMOJIS[i % BURST_EMOJIS.length];
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 130;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist - 40 + 'px');
      s.style.setProperty('--rot', (Math.random() * 260 - 130) + 'deg');
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
  }

  avatar.addEventListener('click', (e) => {
    clearTimeout(timer);
    clicks++;
    avatar.classList.remove('wiggle');
    void avatar.offsetWidth;          // 强制重排让动画能重播
    avatar.classList.add('wiggle');

    const rect = avatar.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // 小反馈：每次点击喷少量 emoji
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('span');
      s.className = 'burst-emoji';
      s.textContent = BURST_EMOJIS[(Math.random() * BURST_EMOJIS.length) | 0];
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      s.style.setProperty('--dy', (-70 - Math.random() * 60) + 'px');
      s.style.setProperty('--rot', (Math.random() * 200 - 100) + 'deg');
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }

    if (clicks >= 5) {                // 凑够 5 下 → 大彩带 + 文案轮换
      clicks = 0;
      burst(cx, cy);
      showToast(AVATAR_LINES[avatarLineIdx++ % AVATAR_LINES.length]);
    } else if (clicks >= 3) {
      showToast(`再点 ${5 - clicks} 下试试 👀`, 1200);
    }

    timer = setTimeout(() => (clicks = 0), 2500); // 停手 2.5 秒重新数
  });
}
let avatarLineIdx = 0;

/* ══════════════ 5. 技能标签点击弹跳 ══════════════ */
function skillPops() {
  document.querySelectorAll('.skill').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');

      // 弹跳的同时在标签上方蹦一个小 emoji
      const rect = btn.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'burst-emoji';
      s.textContent = ['🎉', '✨', '⚡'][Math.random() * 3 | 0];
      s.style.left = rect.left + rect.width / 2 + 'px';
      s.style.top = rect.top + 'px';
      s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      s.style.setProperty('--dy', '-56px');
      s.style.setProperty('--rot', '30deg');
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    });
  });
}

/* ══════════════ 6. 联系按钮 & footer 心心 ══════════════ */
function contactFun() {
  // 微信按钮：复制微信号
  $('#wechat-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(WECHAT_ID);
      showToast('微信号已复制：' + WECHAT_ID + ' 📋');
    } catch {
      showToast('微信号：' + WECHAT_ID + '（手动复制一下～）');
    }
  });

  // footer 的 ❤️ 点了会跳一下
  const heart = $('#heart');
  let beats = 0;
  heart.addEventListener('click', () => {
    heart.classList.remove('beat');
    void heart.offsetWidth;
    heart.classList.add('beat');
    if (++beats === 10) {
      beats = 0;
      showToast('谢谢你这么爱我 🥹');
    }
  });
}

/* ══════════════ 7. 隐藏彩蛋：↑↑↓↓←→←→BA 键盘彩虹雨 ══════════════ */
function konamiRain() {
  const CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;

  addEventListener('keydown', (e) => {
    idx = e.key === CODE[idx] ? idx + 1 : (e.key === CODE[0] ? 1 : 0);
    if (idx === CODE.length) {
      idx = 0;
      showToast('🎮 恭喜发现隐藏彩蛋！元气 +10086');
      for (let i = 0; i < 40; i++) {
        const s = document.createElement('span');
        s.className = 'rain-emoji';
        s.textContent = RAIN_EMOJIS[Math.random() * RAIN_EMOJIS.length | 0];
        s.style.left = Math.random() * 96 + 'vw';
        s.style.animationDuration = 2.4 + Math.random() * 2 + 's';
        s.style.animationDelay = Math.random() * 0.9 + 's';
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      }
    }
  });
}

/* ══════════════ 启动 ══════════════ */
typewriter();
revealOnScroll();
mouseTrail();
avatarEasterEgg();
skillPops();
contactFun();
konamiRain();

console.log('%c👋 嘿！居然翻到了控制台…其实还有一个键盘彩蛋藏在 footer 提示里 ;)',
  'color:#ff8a3d;font-size:14px;font-weight:bold;');
