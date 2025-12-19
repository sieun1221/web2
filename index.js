/* ==========================================================
   🔹 DOM 요소
========================================================== */
const items = document.querySelectorAll('.item');
const info = document.querySelector('.card-info');
const countryName = document.querySelector('.country-name');
const leftArrow = document.querySelector('.arrow.left');
const rightArrow = document.querySelector('.arrow.right');

/* ==========================================================
   🔹 데이터
========================================================== */
const countryList = ['Japan', 'Ireland', 'Türkiye', 'Switzerland'];
const countryLinks = [
  'files/japan.html',
  'files/ireland.html',
  'files/turkiye.html',
  'files/switzerland.html'
];

/* 🚨 [추가된 기능] URL 파라미터(?selected=숫자) 읽기 */
const params = new URLSearchParams(window.location.search);
// 파라미터가 있으면 그 번호로, 없으면 0(일본)으로 시작
let current = params.has('selected') ? parseInt(params.get('selected')) : 0;

/* ==========================================================
   🔒 입력 락 (연타 방지)
========================================================== */
let inputLocked = false;
const INPUT_LOCK_MS = 160;
function lockInput() {
  inputLocked = true;
  setTimeout(() => (inputLocked = false), INPUT_LOCK_MS);
}

/* ==========================================================
   🌀 카드 궤도 업데이트
========================================================== */
// isImmediate 파라미터 추가: true일 경우 애니메이션(transition)을 끕니다.
function updateOrbit(isImmediate = false) {
  const total = items.length;
  const radiusX = window.innerHeight * 1.08;
  const radiusY = window.innerHeight * 0.82;
  const centerX = window.innerWidth / 2;
  const centerY = -660;

  const BASE_ANGLE_STEP = (25 * Math.PI) / 180; // 카드 간격 기준

  for (let i = 0; i < total; i++) {
    const offset = i - current;
    const absOffset = Math.abs(offset);
    const baseAngle = Math.PI / 2;

    // 카드 간격 확장
    let customStretch = absOffset >= 2 ? 0.95 : 1.0;

    const angle = baseAngle - offset * BASE_ANGLE_STEP * customStretch;

    const x = radiusX * Math.cos(angle);
    const y = radiusY * Math.sin(angle);
    const bottom = y + centerY + 100;

    const distance = absOffset;
    const scale = distance === 0 ? 1.3 : distance === 1 ? 0.9 : 0.8;

    let deltaBottom = 0;
    if (i === current) {
      const originalHeight = 462;
      deltaBottom = (originalHeight * scale - originalHeight) / 2;
      items[i].style.transformOrigin = 'center center';
    } else {
      items[i].style.transformOrigin = 'center bottom';
    }

    // 🚨 즉시 이동 모드일 경우 transition을 잠시 끕니다
    if (isImmediate) {
        items[i].style.transition = 'none';
    } else {
        items[i].style.transition = ''; // CSS에 설정된 기본값(transition)으로 복구
    }

    items[i].style.left = `${centerX + x - 139}px`;
    items[i].style.bottom = `${bottom + deltaBottom}px`;
    items[i].style.transform = `scale(${scale})`;
    items[i].classList.toggle('active', i === current);
    items[i].style.cursor = i === current ? 'pointer' : 'grab';
    items[i].style.zIndex = String(1000 + (i === current ? 1000 : 0) + Math.round(bottom));
  }

  // 🌟 배경 이미지 전환
  const CLASS_NAMES_MAP = ['japan', 'ireland', 'turkiye', 'switzerland'];
  const currentClassBase = CLASS_NAMES_MAP[current];
  const countryClass = `bg-${currentClassBase}`;

  document.body.classList.forEach(cls => {
    if (cls.startsWith('bg-')) document.body.classList.remove(cls);
  });

  document.body.classList.add(countryClass);

  countryName.textContent = countryList[current];
  info.classList.add('active');

  // 즉시 이동 후, 약간의 딜레이 뒤에 다시 transition을 살립니다 (부드러운 움직임을 위해)
  if (isImmediate) {
      setTimeout(() => {
          items.forEach(item => item.style.transition = '');
      }, 50);
  }
}

// 🚨 초기 실행 시 URL 파라미터가 있으면 즉시 이동(true)
updateOrbit(params.has('selected'));
window.addEventListener('resize', () => updateOrbit(false));

/* ==========================================================
   ⌨️ 네비게이션 입력
========================================================== */
window.addEventListener('wheel', e => {
  if (inputLocked) return;
  if (e.deltaY > 0 && current < items.length - 1) current++;
  else if (e.deltaY < 0 && current > 0) current--;
  updateOrbit();
  lockInput();
}, { passive: true });

window.addEventListener('keydown', e => {
  if (inputLocked) return;
  if (e.key === 'ArrowRight' && current < items.length - 1) {
    current++;
    updateOrbit();
    lockInput();
  } else if (e.key === 'ArrowLeft' && current > 0) {
    current--;
    updateOrbit();
    lockInput();
  } else if (e.key === 'Enter') clickActiveCard();
});

leftArrow.addEventListener('click', () => {
  if (inputLocked || current === 0) return;
  current--;
  updateOrbit();
  lockInput();
});
rightArrow.addEventListener('click', () => {
  if (inputLocked || current === items.length - 1) return;
  current++;
  updateOrbit();
  lockInput();
});

/* ==========================================================
   🖱️ 클릭 / 드래그 / 스와이프
========================================================== */
let isDragging = false, dragEnabled = true, startX = 0, endX = 0, pressedIndex = -1;

function indexFromEventTarget(target) {
  for (let i = 0; i < items.length; i++) if (items[i].contains(target)) return i;
  return -1;
}

// --- MOUSE EVENTS ---
document.addEventListener('mousedown', e => {
  pressedIndex = indexFromEventTarget(e.target);

  if (pressedIndex === current && pressedIndex !== -1) {
    dragEnabled = false;
    isDragging = false;
    startX = e.clientX;
    return;
  }

  dragEnabled = true;
  isDragging = true;
  startX = e.clientX;
  endX = startX;
  document.body.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', e => {
  if (isDragging && dragEnabled) endX = e.clientX;
});

document.addEventListener('mouseup', e => {
  if (!dragEnabled && pressedIndex === current && pressedIndex !== -1) {
    if (Math.abs(e.clientX - startX) < 10) clickActiveCard();
  } else if (isDragging && dragEnabled) {
    const diff = endX - startX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && current > 0) current--;
      else if (diff < 0 && current < items.length - 1) current++;
      updateOrbit();
    }
  }

  // reset
  isDragging = false;
  dragEnabled = true;
  pressedIndex = -1;
  document.body.style.cursor = 'default';
});

document.addEventListener('mouseleave', () => {
  isDragging = false;
  dragEnabled = true;
  pressedIndex = -1;
  document.body.style.cursor = 'default';
});

// --- TOUCH EVENTS ---
document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  pressedIndex = indexFromEventTarget(e.target);

  if (pressedIndex === current && pressedIndex !== -1) {
    dragEnabled = false;
    isDragging = false;
    startX = t.clientX;
    return;
  }

  dragEnabled = true;
  isDragging = true;
  startX = t.clientX;
  endX = startX;
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!isDragging || !dragEnabled) return;
  endX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!dragEnabled && pressedIndex === current && pressedIndex !== -1) {
    if (Math.abs(endX - startX) < 10) clickActiveCard();
  } else if (isDragging && dragEnabled) {
    const diff = endX - startX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && current > 0) current--;
      else if (diff < 0 && current < items.length - 1) current++;
      updateOrbit();
    }
  }

  // reset
  isDragging = false;
  dragEnabled = true;
  pressedIndex = -1;
});

/* ==========================================================
   🎬 클릭 전환 (중앙 카드 → 확대 → 페이지 이동)
========================================================== */
function clickActiveCard() {
  const active = document.querySelector('.item.active');
  if (!active) return;

  const rect = active.getBoundingClientRect();
  const imgEl = active.querySelector('img');
  const imgSrc = imgEl.src;

  const nW = imgEl.naturalWidth || 278;
  const nH = imgEl.naturalHeight || 462;
  const targetAspect = nW / nH;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 오버레이 생성
  const initialHeight = rect.height;
  const overlay = document.createElement('div');
  overlay.className = 'transition-overlay';
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${initialHeight}px`;
  overlay.style.left = `${cx}px`;
  overlay.style.top = `${cy}px`;
  overlay.style.overflow = 'hidden';

  const inner = document.createElement('div');
  inner.className = 'overlay-inner';

  const img = document.createElement('img');
  img.className = 'overlay-img';
  img.src = imgSrc;

  inner.appendChild(img);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  // 1️⃣ 가운데 기준 가로 확장
  const widenWidth = initialHeight * targetAspect;
  requestAnimationFrame(() => {
    overlay.style.height = `${initialHeight}px`;
    overlay.style.width = `${widenWidth}px`;
  });

  // 2️⃣ 홀드
  const HOLD_MS = 250;

  // 3️⃣ 전체 확대
  setTimeout(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const curW = widenWidth;
    const curH = initialHeight;
    const scaleToCover = Math.max(vw / curW, vh / curH);
    const OFFSET_PERCENT = 1.0;
    const verticalOffset = vh * OFFSET_PERCENT / 100;

    overlay.style.overflow = 'visible';
    overlay.style.setProperty('--final-scale', scaleToCover);
    overlay.style.setProperty('--vertical-offset', `${verticalOffset}px`);

    overlay.classList.add('expand');
  }, 800 + HOLD_MS);

  // 4️⃣ 페이지 이동
  setTimeout(() => {
    window.location.href = countryLinks[current];
  }, 800 + HOLD_MS + 900);
}