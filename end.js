// --- 공통 로직 (모든 end.html 파일에 동일하게 적용) ---
const cardWrap = document.getElementById('card-wrap');
    
let currentIndex = 0; 
let visualProgress = 0; 
const totalCards = cardsData.length;
let isAnimating = false;

// 카드 요소 생성
cardsData.forEach(data => {
  const card = document.createElement('a');
  card.href = `${countryPage}?start=${data.stage}`; 
  card.className = 'card';
  card.style.textDecoration = 'none'; 
  card.style.color = 'inherit';
  card.style.display = 'flex';
  card.innerHTML = `<img src="${data.img}" alt="${data.label}"><span class="card-label">${data.label}</span>`;
  cardWrap.appendChild(card);
});

const cards = document.querySelectorAll('.card');

// 🚨 [핵심] 애니메이션 및 하얀 안개 농도 계산 함수
function animate() {
  visualProgress += (currentIndex - visualProgress) * 0.1;

  cards.forEach((card, index) => {
    const offset = index - visualProgress; 
    const x = offset * 540; 
    const y = Math.abs(offset) * 30 + Math.pow(offset, 2) * 20;
    const scale = Math.max(0.8, 1 - Math.abs(offset) * 0.15);
    
    const zIndex = 100 - Math.round(Math.abs(offset) * 10);

    // 🔥 거리 비례 하얀 안개 농도 계산 (0 ~ 0.7 사이)
    // offset이 0(중앙)이면 -> 0 (투명)
    // offset이 1(옆)이면   -> 0.25 (살짝 하양)
    // offset이 2(끝)이면   -> 0.5 (더 하양)
    let whiteOverlay = Math.abs(offset) * 0.25;
    
    // 너무 하얗게 되지 않도록 최대값 제한 (0.7 이상 안 올라감)
    if (whiteOverlay > 0.7) whiteOverlay = 0.7;

    // 계산된 농도를 CSS 변수로 실시간 전달
    card.style.setProperty('--overlay-opacity', whiteOverlay);

    card.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
    card.style.zIndex = zIndex;

    if (Math.abs(offset) < 0.3) card.classList.add('active');
    else card.classList.remove('active');
  });
  requestAnimationFrame(animate);
}
animate();

// 휠 이벤트
window.addEventListener('wheel', e => {
  if (isAnimating) return;
  const threshold = 30;
  if (Math.abs(e.deltaY) > threshold) {
    if (e.deltaY > 0) {
      if (currentIndex < totalCards - 1) { currentIndex++; triggerWheelCooldown(); }
    } else {
      if (currentIndex > 0) { currentIndex--; triggerWheelCooldown(); }
    }
  }
});

function triggerWheelCooldown() {
  isAnimating = true;
  setTimeout(() => { isAnimating = false; }, 300);
}