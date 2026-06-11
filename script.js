// =========================================
// 0. スクロール駆動アニメーション対応判定
//    対応ブラウザでは進捗バー・パララックス・オーナメント・
//    Reveal を CSS（@supports）側に任せ、JSは二重処理しない。
//    非対応ブラウザ（Safari / Firefox 等）では従来どおりJSで動かす。
// =========================================
const SUPPORTS_SCROLL_TIMELINE =
  window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');

// =========================================
// 1. 進捗バー
// =========================================
const progressBar = document.getElementById('progressBar');
function updateProgress() {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressBar.style.width = pct + '%';
}

// =========================================
// 2. パララックス
// =========================================
const parallaxEls = document.querySelectorAll('[data-parallax]');
function updateParallax() {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.parallax);
    el.style.transform = `translateY(${y * speed}px)`;
  });
}

// =========================================
// 3. オーナメント : スクロールでゆっくり回転＆縮小
// =========================================
const ornament = document.getElementById('ornament');
function updateOrnament() {
  if (!ornament) return;
  const y = window.scrollY;
  const rot = y * 0.03; // 緩やか
  const scale = Math.max(0.65, 1 - y / 2000);
  const op = Math.max(0.3, 1 - y / 900);
  ornament.style.transform = `rotate(${rot}deg) scale(${scale})`;
  ornament.style.opacity = op;
}

// =========================================
// 4. ヒーロータイトル : スクロールで上方へフェード＆縮小
// =========================================
const heroTitle = document.getElementById('heroTitle');
function updateHero() {
  if (!heroTitle) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const p = Math.min(y / vh, 1);
  heroTitle.style.transform = `translateY(${p * -60}px) scale(${1 - p * 0.1})`;
  heroTitle.style.opacity = 1 - p * 0.85;
}

// =========================================
// 5. Reveal : Intersection Observer
// =========================================
// 対応ブラウザでは CSS の animation-timeline: view() が担当するため不要
if (!SUPPORTS_SCROLL_TIMELINE) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// =========================================
// 6. セクションごとに body 背景色を切替
//    大理石の中で微妙にトーンが変わる
// =========================================
const bgMap = {
  hero:     '#f7f9fc',
  about:    '#eef1f6',
  schedule: '#f7f9fc',
  members:  '#eef1f6',
  contact:  '#f7f9fc',
};
const bgObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && bgMap[e.target.id]) {
      document.body.style.backgroundColor = bgMap[e.target.id];
    }
  });
}, { threshold: 0.4 });
Object.keys(bgMap).forEach(id => {
  const el = document.getElementById(id);
  if (el) bgObserver.observe(el);
});

// =========================================
// 7. スティッキーピン : 実績パネル横スクロール
// =========================================
const pinSection = document.getElementById('results');
const pinPanels = document.getElementById('pinPanels');
function updatePin() {
  if (!pinSection || !pinPanels) return;
  const rect = pinSection.getBoundingClientRect();
  const total = pinSection.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const progress = scrolled / total;
  const maxX = pinPanels.scrollWidth - window.innerWidth + 96;
  pinPanels.style.transform = `translateX(${-progress * Math.max(0, maxX)}px)`;
}

// =========================================
// rAF にまとめる
// =========================================
let ticking = false;
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      // 進捗バー・パララックス・オーナメントは対応ブラウザでは CSS が担当
      if (!SUPPORTS_SCROLL_TIMELINE) {
        updateProgress();
        updateParallax();
        updateOrnament();
      }
      updateHero();  // ヒーローの縮小は導入アニメと整合させるため常にJSで処理
      updatePin();   // 横スクロール（sticky pin）は対象外
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// =========================================
// 8. カスタムカーソル（クロスヘア）
//    タッチ端末では @media で非表示にしているのでスキップ判定だけ入れる
// =========================================
const cursorEl = document.getElementById('cursorCross');
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (cursorEl && isFinePointer) {
  // 即時追従（補間なし）。transform は GPU 合成されるので mousemove で直接更新して問題ない
  window.addEventListener('mousemove', (e) => {
    cursorEl.style.transform =
      `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
  }, { passive: true });

  // 画面外/復帰時のフェード
  window.addEventListener('mouseleave', () => cursorEl.style.opacity = '0');
  window.addEventListener('mouseenter', () => cursorEl.style.opacity = '1');

  // インタラクティブ要素にホバーしたら拡大
  const hoverables = document.querySelectorAll(
    'a, button, .result, .member, .nav-links li'
  );
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => cursorEl.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursorEl.classList.remove('is-hover'));
  });
}

// =========================================
// 9. ヒーロータイトル : カーニング・リビール
//    広がっていた文字が滑らかに詰まり、同時にフェードイン
// =========================================
window.addEventListener('load', () => {
  if (!heroTitle) return;
  heroTitle.style.opacity = '0';
  heroTitle.style.letterSpacing = '0.5em';
  heroTitle.style.filter = 'blur(8px)';
  heroTitle.style.transition =
    'opacity 1.6s ease, letter-spacing 1.6s cubic-bezier(.2,.7,.2,1), filter 1.6s ease';

  requestAnimationFrame(() => {
    heroTitle.style.opacity = '1';
    heroTitle.style.letterSpacing = '-0.02em';
    heroTitle.style.filter = 'blur(0)';
  });
});

// =========================================
// 10. Contact : メールアドレスのコピー
// =========================================
document.querySelectorAll('.contact-copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy || '';
    const label = btn.querySelector('.cc-label');
    const original = label ? label.textContent : '';

    const done = () => {
      btn.classList.add('is-copied');
      if (label) label.textContent = 'COPIED';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (label) label.textContent = original;
      }, 1600);
    };

    try {
      await navigator.clipboard.writeText(text);
      done();
    } catch {
      // フォールバック : 一時的な textarea を介して選択コピー
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch {}
      document.body.removeChild(ta);
    }
  });
});
