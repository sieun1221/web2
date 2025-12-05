// country-scroll.js

let scrolled = false;
const body = document.body;

// DOM 요소 선택
const mouseTrigger = document.querySelector(".mouse-trigger");
const titleElement = document.querySelector(".title");
const captionElement = document.querySelector(".caption");
const centerOrb = document.querySelector(".center-orb");
const orbHint = document.querySelector(".orb-hint");
const backgroundAudio = document.getElementById("background-audio");
const sfxAudio = document.getElementById("sfx-audio");
const bottomArc = document.querySelector(".bottom-arc");
const musicBarProgress = document.querySelector(".music-bar-progress");
const nextStageArrow = document.querySelector(".next-stage-arrow");
const prevStageArrow = document.querySelector(".prev-stage-arrow");
const resetButton = document.querySelector(".reset-button");
// 라벨 요소 선택
const stageLabel = document.querySelector(".stage-label");

// 볼륨 컨트롤 요소
const volumeControl = document.querySelector(".volume-control");
const volumeIcon = document.querySelector(".volume-icon");
const volumeSlider = document.querySelector(".volume-slider");
const volumeTrack = document.querySelector(".volume-track");
const volumeLevel = document.querySelector(".volume-level");
const volumeHandle = document.querySelector(".volume-handle");

// 현재 페이지 이름에서 나라 이름 추출
const path = window.location.pathname;
const filename = path.substring(path.lastIndexOf("/") + 1);
let countryNameLower = filename.replace(".html", "").replace("end", "");

const initialBgAudioSrc = backgroundAudio ? backgroundAudio.getAttribute("src") : null;
const NUM_ORBS = 4;
let orbsClicked = 0;
let currentStage = 0;

// 시간대 텍스트 매핑
const TIME_TEXTS = {
  1: "Morning",
  2: "Afternoon",
  3: "Dinner"
};

// 나라별 도시 이름 매핑
const CITY_MAP = {
  japan: {
    1: "Tokyo",
    2: "Kyoto",
    3: "Osaka"
  },
  ireland: {
    1: "Dublin",
    2: "Cliffs of Moher",
    3: "Galway"
  },
  switzerland: {
    1: "Interlaken",
    2: "Zurich",
    3: "Matterhorn"
  },
  turkiye: {
    1: "Istanbul",
    2: "Cappadocia",
    3: "Antalya"
  }
};

// 스테이지 설정
const STAGE_CONFIG = {
  1: { bgImgNum: 2, bgmIndex: null, sfxBase: 1 },
  2: { bgImgNum: 3, bgmIndex: 5, sfxBase: 5 },
  3: { bgImgNum: 4, bgmIndex: 9, sfxBase: 9 }
};

console.log(`✅ JS Loaded. Country: ${countryNameLower}`);

if (backgroundAudio) backgroundAudio.volume = 0.3;
if (sfxAudio) sfxAudio.volume = 0.3;

// 오디오 재생
function playBackgroundAudio() {
  if (backgroundAudio) {
    backgroundAudio.play().catch(e => {
      console.log("Audio play blocked.", e);
    });
  }
}

// 오디오 정지
function stopAllAudio() {
  if (backgroundAudio) {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
  }
  if (sfxAudio) {
    sfxAudio.pause();
    sfxAudio.currentTime = 0;
  }
}

// 음악바 업데이트
if (backgroundAudio) {
  backgroundAudio.addEventListener("timeupdate", () => {
    if (musicBarProgress && backgroundAudio.duration) {
      const percent = (backgroundAudio.currentTime / backgroundAudio.duration) * 100;
      musicBarProgress.style.width = `${percent}%`;
    }
  });

  backgroundAudio.addEventListener("ended", () => {
    backgroundAudio.currentTime = 0;
    playBackgroundAudio();
  });
}

// 텍스트 span 래핑
function wrapTextInSpans(element) {
  if (!element) return;
  const text = element.textContent.trim();
  element.innerHTML = text
    .split("")
    .map(char => (char === " " ? " " : `<span class="char">${char}</span>`))
    .join("");
}

// 텍스트 사라짐 애니메이션
function disappearText() {
  [titleElement, captionElement].forEach(el => {
    if (el) {
      el.querySelectorAll(".char").forEach((span, i) => {
        setTimeout(() => {
          span.style.transition = "opacity 0.4s ease-out";
          span.style.opacity = "0";
        }, i * 40);
      });
    }
  });

  if (mouseTrigger) {
    mouseTrigger.style.opacity = "0";
    mouseTrigger.style.pointerEvents = "none";
  }

  if (captionElement) captionElement.classList.add("disappeared");
}

// 첫 스크롤 상태 세팅
const setScrolledState = () => {
  if (scrolled) return;
  scrolled = true;
  body.classList.add("scrolled");
  disappearText();
  playBackgroundAudio();
};

// 랜덤 오브 생성
function initializeRandomOrbs() {
  orbsClicked = 0;
  document.querySelectorAll(".random-orb").forEach(orb => orb.remove());

  const positions = [];
  const marginX = 10;
  const sectionWidth = (100 - marginX * 2) / NUM_ORBS;

  for (let i = 0; i < NUM_ORBS; i++) {
    const minX = marginX + i * sectionWidth;
    const maxX = minX + sectionWidth - 5;

    positions.push({
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * 40 + 15
    });
  }

  positions.forEach((pos, i) => {
    const orb = document.createElement("div");
    orb.className = "random-orb";
    orb.dataset.index = i + 1;
    orb.style.left = `${pos.x}vw`;
    orb.style.top = `${pos.y}vh`;

    orb.addEventListener("click", handleOrbClickStage1);
    body.appendChild(orb);

    setTimeout(() => {
      orb.style.opacity = "1";
      orb.style.transform = "translate(-50%, -50%) scale(1)";
    }, i * 150);
  });

  document.body.classList.add("volume-visible");
  document.body.classList.add("nav-visible");
}

// 스테이지 초기화 및 라벨 갱신
function initializeStage(stage) {
  if (stage < 1 || stage > 3) return;
  currentStage = stage;

  document.body.classList.remove("nav-visible");
  document.body.classList.remove("stage-ready");
  document.querySelectorAll(".random-orb").forEach(orb => orb.remove());

  const config = STAGE_CONFIG[currentStage];

  // 배경 설정
  const bgPath = `../images/${countryNameLower}${config.bgImgNum}.jpg`;
  document.body.style.backgroundImage = `url('${bgPath}')`;

  // 라벨 텍스트 업데이트
  if (stageLabel) {
    const time = TIME_TEXTS[currentStage];
    const cityData = CITY_MAP[countryNameLower];
    const city = cityData ? cityData[currentStage] : countryNameLower;
    stageLabel.textContent = `0${currentStage}. ${city}, ${time}`;
  }

  // 배경 음악 설정
  stopAllAudio();

  let bgmPath =
    currentStage === 1
      ? initialBgAudioSrc
      : `./audio/${countryNameLower}${config.bgmIndex}.mp3`;

  if (backgroundAudio) {
    backgroundAudio.src = bgmPath;
    backgroundAudio.loop = true;
  }

  setTimeout(initializeRandomOrbs, 500);
  updateNavArrows();
}

// 중앙 오브 클릭
const handleOrbClick = () => {
  if (document.body.classList.contains("content-active")) return;

  document.body.classList.add("content-active");

  if (centerOrb) {
    centerOrb.style.transition = "opacity 0.3s ease";
    centerOrb.style.opacity = "0";
    centerOrb.style.pointerEvents = "none";
  }

  if (orbHint) {
    orbHint.style.transition = "opacity 0.3s ease";
    orbHint.style.opacity = "0";
  }

  if (bottomArc) {
    bottomArc.style.transform = "translateX(-50%) translateY(100px) scale(0.8)";
    bottomArc.style.opacity = "1";
  }

  initializeStage(1);
};

// 랜덤 오브 클릭
function handleOrbClickStage1(e) {
  const target = e.target;
  if (target.classList.contains("clicked")) return;

  if (backgroundAudio) backgroundAudio.pause();
  if (sfxAudio) {
    sfxAudio.pause();
    sfxAudio.currentTime = 0;
  }

  orbsClicked++;
  target.classList.add("clicked");
  target.style.pointerEvents = "none";

  const baseIndex = parseInt(target.dataset.index, 10);
  const sfxBase = STAGE_CONFIG[currentStage].sfxBase;
  const finalIndex = sfxBase + baseIndex - 1;
  const sfxPath = `./audio/${countryNameLower}${finalIndex}.mp3`;

  if (sfxAudio) {
    sfxAudio.src = sfxPath;
    sfxAudio.play().catch(e => console.error(e));
  }

  if (orbsClicked === NUM_ORBS) {
    document.body.classList.add("stage-ready");
    updateNavArrows();
  }
}

// 네비게이션 상태 갱신
function updateNavArrows() {
  if (!prevStageArrow || !nextStageArrow) return;

  prevStageArrow.classList.remove("nav-disabled");
  nextStageArrow.classList.remove("nav-disabled");

  if (currentStage <= 1) {
    prevStageArrow.classList.add("nav-disabled");
  }
}

// 다음 스테이지 이동
function proceedToSwipeStage() {
  if (currentStage === 3) {
    window.location.href = `${countryNameLower}end.html`;
    return;
  }
  initializeStage(currentStage + 1);
}

// 이전 스테이지 이동
function goToPrevStage() {
  if (currentStage > 1) initializeStage(currentStage - 1);
}

// 리셋
function softResetStage() {
  initializeStage(currentStage);
}

// 볼륨 컨트롤
function initVolumeControl() {
  if (
    !volumeControl ||
    !volumeIcon ||
    !volumeSlider ||
    !volumeTrack ||
    !volumeLevel ||
    !volumeHandle
  )
    return;

  function setVolume(val) {
    const v = Math.max(0, Math.min(1, val));

    if (backgroundAudio) backgroundAudio.volume = v;
    if (sfxAudio) sfxAudio.volume = v;

    volumeLevel.style.height = `${v * 100}%`;

    const trackH = volumeTrack.offsetHeight;
    volumeHandle.style.bottom = `${v * trackH - volumeHandle.offsetHeight / 2}px`;
  }

  setVolume(0.3);

  volumeIcon.addEventListener("click", e => {
    e.stopPropagation();
    volumeControl.classList.toggle("open");
  });

  let isDragging = false;

  const updateDrag = e => {
    const rect = volumeTrack.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const ratio = (rect.bottom - clientY) / rect.height;
    setVolume(ratio);
  };

  volumeSlider.addEventListener("mousedown", e => {
    isDragging = true;
    updateDrag(e);
  });
  window.addEventListener("mousemove", e => {
    if (isDragging) {
      e.preventDefault();
      updateDrag(e);
    }
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  volumeSlider.addEventListener(
    "touchstart",
    e => {
      isDragging = true;
      updateDrag(e);
    },
    { passive: false }
  );
  window.addEventListener(
    "touchmove",
    e => {
      if (isDragging) {
        e.preventDefault();
        updateDrag(e);
      }
    },
    { passive: false }
  );
  window.addEventListener("touchend", () => {
    isDragging = false;
  });

  document.addEventListener("click", e => {
    if (!volumeControl.contains(e.target)) volumeControl.classList.remove("open");
  });
}

// 실행
if (titleElement) wrapTextInSpans(titleElement);
if (captionElement) wrapTextInSpans(captionElement);

window.addEventListener(
  "wheel",
  e => {
    if (scrolled) return;
    if (Math.abs(e.deltaY) > 0) setScrolledState();
  },
  { passive: true }
);

if (centerOrb) centerOrb.addEventListener("click", handleOrbClick);
if (nextStageArrow) nextStageArrow.addEventListener("click", proceedToSwipeStage);
if (prevStageArrow) prevStageArrow.addEventListener("click", goToPrevStage);
if (resetButton) resetButton.addEventListener("click", softResetStage);

initVolumeControl();
updateNavArrows();

// URL 파라미터 점프
const urlParams = new URLSearchParams(window.location.search);
const startStage = urlParams.get("start");

if (startStage) {
  setScrolledState();
  document.body.classList.add("content-active");

  if (mouseTrigger) mouseTrigger.style.opacity = "0";
  if (titleElement) titleElement.style.display = "none";
  if (captionElement) captionElement.style.display = "none";
  if (centerOrb) centerOrb.style.display = "none";
  if (orbHint) orbHint.style.display = "none";

  initializeStage(parseInt(startStage, 10));
}
