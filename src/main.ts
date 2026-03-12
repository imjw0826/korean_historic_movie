import "./style.css";
import {
  centuryMarks,
  formatYearRange,
  siteMeta,
  sortedMovies,
  timelineEvents,
  timelineRange,
} from "./data";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app container was not found.");
}

let selectedIndex = Math.max(
  0,
  sortedMovies.findIndex((movie) => movie.title === "왕의 남자"),
);
let currentMovies = [...sortedMovies];
let searchQuery = "";
let searchDraft = "";
let trackWidth = 9600;
const trackPadding = 180;
let posterCards: HTMLAnchorElement[] = [];
let movieRanges: HTMLElement[] = [];
let timelineTrack: HTMLElement | null = null;
let timelineSection: HTMLElement | null = null;
let carouselWindow: HTMLElement | null = null;
let searchForm: HTMLFormElement | null = null;
let searchInput: HTMLInputElement | null = null;
let activeDetail: HTMLElement | null = null;
let activeTitleText: HTMLElement | null = null;
let activePeriodText: HTMLElement | null = null;
let activeYearText: HTMLElement | null = null;
let activeFocusText: HTMLElement | null = null;
let activeReleaseText: HTMLElement | null = null;
let liveRegion: HTMLElement | null = null;
let connectorLine: HTMLElement | null = null;
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let prefersReducedMotion = false;

const clampIndex = (index: number) =>
  Math.max(0, Math.min(index, currentMovies.length - 1));

const yearToRatio = (year: number) =>
  (year - timelineRange.start) / (timelineRange.end - timelineRange.start);

const yearToTrackX = (year: number) =>
  trackPadding + yearToRatio(year) * (trackWidth - trackPadding * 2);

const getOffsetX = (offset: number) => {
  const nearStep = Math.min(278, window.innerWidth * 0.28);
  const farStep = Math.min(396, window.innerWidth * 0.39);

  if (offset === 0) {
    return 0;
  }

  if (Math.abs(offset) === 1) {
    return offset * nearStep;
  }

  return offset * farStep;
};

const getOffsetScale = (offset: number) => {
  if (offset === 0) {
    return 1;
  }

  if (Math.abs(offset) === 1) {
    return 0.74;
  }

  return 0.52;
};

const getOffsetOpacity = (offset: number) => {
  if (offset === 0) {
    return 1;
  }

  if (Math.abs(offset) === 1) {
    return 0.72;
  }

  return 0.18;
};

const getOffsetBlur = (offset: number) => {
  if (offset === 0) {
    return 0;
  }

  if (Math.abs(offset) === 1) {
    return 0.4;
  }

  return 1.7;
};

const syncMeasurements = () => {
  trackWidth = Math.max(
    window.innerWidth * 5.4,
    (timelineRange.end - timelineRange.start) * 6.2,
    currentMovies.length * 84,
    9600,
  );
};

const syncMotionPreference = () => {
  prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("reduced-motion", prefersReducedMotion);
};

const getActivePosterMetrics = () => {
  const activePoster = posterCards[selectedIndex];

  if (!activePoster || !timelineSection) {
    return null;
  }

  const sectionRect = timelineSection.getBoundingClientRect();
  const posterTop = activePoster.offsetTop;
  const posterWidth = activePoster.offsetWidth;
  const posterHeight = posterWidth * 1.5;
  const posterBottom = posterTop + posterHeight;
  const posterCenterX = window.innerWidth / 2 - sectionRect.left;

  return { posterBottom, posterCenterX };
};

const preloadAdjacentPosters = () => {
  [selectedIndex - 1, selectedIndex + 1].forEach((index) => {
    if (index < 0 || index >= currentMovies.length) {
      return;
    }

    const preloadImage = new Image();
    preloadImage.src = currentMovies[index].posterUrl;
  });
};

const updateAnnouncement = () => {
  if (!liveRegion) {
    return;
  }

  const activeMovie = currentMovies[selectedIndex];
  if (!activeMovie) {
    liveRegion.textContent = searchQuery
      ? `"${searchQuery}" 검색 결과가 없습니다.`
      : "";
    return;
  }
  const periodText =
    activeMovie.settingStart === activeMovie.settingEnd
      ? `${activeMovie.settingStart}년`
      : `${activeMovie.settingStart}년부터 ${activeMovie.settingEnd}년`;

  liveRegion.textContent = `현재 ${selectedIndex + 1}번째 영화 ${activeMovie.title}. 시대 배경은 ${periodText}. 개봉 연도는 ${activeMovie.releaseYear}년.`;
};

const applySearch = () => {
  searchQuery = searchDraft.trim();

  currentMovies = [...sortedMovies];

  if (!searchQuery) {
    updateScene();
    return;
  }

  const keyword = searchQuery.toLowerCase();
  const matchedIndex = currentMovies.findIndex((movie) => {
    return (
      movie.title.toLowerCase().includes(keyword) ||
      movie.historicalFocus.toLowerCase().includes(keyword) ||
      movie.period.toLowerCase().includes(keyword)
    );
  });

  if (matchedIndex === -1) {
    if (liveRegion) {
      liveRegion.textContent = `"${searchQuery}" 검색 결과가 없습니다.`;
    }
    return;
  }

  selectedIndex = matchedIndex;
  updateScene();
};

const createPosterMarkup = () =>
  currentMovies
    .map((movie, index) => {
      const safeTitle = `${movie.title} · ${movie.historicalFocus}`;

      return `
        <a
          class="poster-card"
          data-card-index="${index}"
          href="${movie.link}"
          target="_blank"
          rel="noreferrer noopener"
          title="${safeTitle}"
        >
          <img src="${movie.posterUrl}" alt="${movie.title} 포스터" loading="lazy" />
        </a>
      `;
    })
    .join("");

const createEventMarkup = () => {
  const sortedEvents = [...timelineEvents].sort((left, right) => left.year - right.year);
  const rowLastX: number[] = [];

  return sortedEvents
    .map((event) => {
      const x = yearToTrackX(event.year);
      let row = 0;

      while (rowLastX[row] !== undefined && x - rowLastX[row] < 128) {
        row += 1;
      }

      rowLastX[row] = x;

      return `
        <div
          class="timeline-event"
          style="left: ${x}px; --event-offset: ${row * 32}px"
        >
          <span class="timeline-event__line"></span>
          <span class="timeline-event__label">${event.label}</span>
        </div>
      `;
    })
    .join("");
};

const createCenturyMarkup = () =>
  centuryMarks
    .map(
      (year) => `
        <div class="century-mark" style="left: ${yearToTrackX(year)}px">
          <span class="century-mark__line"></span>
          <span class="century-mark__label">${year}</span>
        </div>
      `,
    )
    .join("");

const createRangeMarkup = () =>
  currentMovies
    .map((movie, index) => {
      const startX = yearToTrackX(movie.settingStart);
      const endX = yearToTrackX(movie.settingEnd);
      const rangeWidth = Math.max(endX - startX, 18);

      return `
        <span
          class="movie-range"
          data-range-index="${index}"
          style="left: ${startX}px; width: ${rangeWidth}px"
        ></span>
      `;
    })
    .join("");

const render = () => {
  syncMeasurements();

  app.innerHTML = `
    <main class="page-shell">
      <header class="page-header">
        <div class="page-header__top">
          <div class="page-header__title-block">
            <p class="page-header__eyebrow">한국 역사영화</p>
            <h1>${siteMeta.title}</h1>
            <p class="page-header__credit">
              만든 사람 ${siteMeta.authorName}
              <a href="${siteMeta.githubUrl}" target="_blank" rel="noreferrer noopener">
                ${siteMeta.githubLabel}
              </a>
            </p>
            <p class="page-header__description">${siteMeta.description}</p>
          </div>

          <form class="header-search" data-search-form aria-label="영화 검색">
            <span class="header-search__label">검색</span>
            <div class="header-search__controls">
              <input
                class="header-search__input"
                type="search"
                placeholder="영화 제목 검색"
                value="${searchDraft}"
                data-search-input
              />
              <button class="header-search__button" type="submit">검색</button>
            </div>
          </form>
        </div>
      </header>

      <section class="timeline-full" data-timeline-section aria-label="한국 역사영화 타임라인">
        <p class="sr-only" data-live-region aria-live="polite" aria-atomic="true"></p>
        <div class="carousel-stage">
          <button
            type="button"
            class="carousel-arrow carousel-arrow--left"
            data-direction="prev"
            aria-label="이전 영화"
          >
            ←
          </button>

          <div class="carousel-window">
            ${createPosterMarkup()}
          </div>

          <div class="active-detail" data-active-detail aria-live="polite">
            <p class="active-detail__period" data-period></p>
            <h2 class="active-detail__title" data-title></h2>
            <p class="active-detail__focus" data-focus></p>
            <div class="active-detail__meta">
              <span class="active-detail__year" data-year></span>
              <span class="active-detail__release" data-release></span>
            </div>
          </div>

          <button
            type="button"
            class="carousel-arrow carousel-arrow--right"
            data-direction="next"
            aria-label="다음 영화"
          >
            →
          </button>
        </div>

        <span class="timeline-connector" data-connector aria-hidden="true"></span>

        <div class="timeline-rail">
          <div class="timeline-track" data-track style="width: ${trackWidth}px">
            <div class="timeline-line"></div>
            ${createCenturyMarkup()}
            ${createRangeMarkup()}
            ${createEventMarkup()}
          </div>
        </div>
      </section>
    </main>
  `;
};

const bindDom = () => {
  posterCards = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-card-index]"),
  );
  movieRanges = Array.from(
    document.querySelectorAll<HTMLElement>("[data-range-index]"),
  );
  carouselWindow = document.querySelector<HTMLElement>(".carousel-window");
  searchForm = document.querySelector<HTMLFormElement>("[data-search-form]");
  searchInput = document.querySelector<HTMLInputElement>("[data-search-input]");
  timelineTrack = document.querySelector<HTMLElement>("[data-track]");
  timelineSection = document.querySelector<HTMLElement>("[data-timeline-section]");
  activeDetail = document.querySelector<HTMLElement>("[data-active-detail]");
  activeTitleText = document.querySelector<HTMLElement>("[data-title]");
  activePeriodText = document.querySelector<HTMLElement>("[data-period]");
  activeYearText = document.querySelector<HTMLElement>("[data-year]");
  activeFocusText = document.querySelector<HTMLElement>("[data-focus]");
  activeReleaseText = document.querySelector<HTMLElement>("[data-release]");
  liveRegion = document.querySelector<HTMLElement>("[data-live-region]");
  connectorLine = document.querySelector<HTMLElement>("[data-connector]");

  if (
    !timelineTrack ||
    !timelineSection ||
    !carouselWindow ||
    !searchForm ||
    !searchInput ||
    !activeDetail ||
    !activeTitleText ||
    !activePeriodText ||
    !activeYearText ||
    !activeFocusText ||
    !activeReleaseText ||
    !liveRegion ||
    !connectorLine
  ) {
    throw new Error("Timeline UI was not initialized.");
  }

  document.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      moveSelection(button.dataset.direction === "next" ? 1 : -1);
    });
  });

  searchInput.addEventListener("input", (event) => {
    searchDraft = (event.target as HTMLInputElement).value;
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applySearch();
  });

  carouselWindow.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchCurrentX = touch.clientX;
    },
    { passive: true },
  );

  carouselWindow.addEventListener(
    "touchmove",
    (event) => {
      touchCurrentX = event.changedTouches[0].clientX;
    },
    { passive: true },
  );

  carouselWindow.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touchCurrentX - touchStartX || touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaX) < 42 || Math.abs(deltaY) > 52) {
        return;
      }

      moveSelection(deltaX < 0 ? 1 : -1);
      touchStartX = 0;
      touchStartY = 0;
      touchCurrentX = 0;
    },
    { passive: true },
  );
};

const drawConnector = () => {
  if (
    !timelineSection ||
    !activeDetail ||
    !connectorLine
  ) {
    return;
  }

  const activeRange = movieRanges[selectedIndex];
  const posterMetrics = getActivePosterMetrics();

  if (!activeRange || !posterMetrics) {
    return;
  }

  const sectionRect = timelineSection.getBoundingClientRect();
  const detailRect = activeDetail.getBoundingClientRect();
  const rangeRect = activeRange.getBoundingClientRect();
  const startY = detailRect.bottom - sectionRect.top + 14;
  const endX = posterMetrics.posterCenterX;
  const endY = rangeRect.top + rangeRect.height / 2 - sectionRect.top;

  connectorLine.style.left = `${endX}px`;
  connectorLine.style.top = `${startY}px`;
  connectorLine.style.height = `${Math.max(0, endY - startY)}px`;
  connectorLine.style.opacity = "1";
};

const updateScene = () => {
  if (
    !timelineTrack ||
    !activeTitleText ||
    !activePeriodText ||
    !activeYearText ||
    !activeFocusText ||
    !activeReleaseText
  ) {
    return;
  }

  const activeMovie = currentMovies[selectedIndex];
  const centerX = window.innerWidth / 2;
  const activeX = yearToTrackX(activeMovie.settingStart);
  const translateX = centerX - activeX;

  posterCards.forEach((card, index) => {
    const offset = index - selectedIndex;
    const clampedOffset = Math.max(-2, Math.min(2, offset));
    const hidden = Math.abs(offset) > 2;
    const translate = getOffsetX(clampedOffset);
    const translateY = Math.abs(clampedOffset) * 12;
    const scale = getOffsetScale(clampedOffset);
    const opacity = getOffsetOpacity(clampedOffset);
    const blur = getOffsetBlur(clampedOffset);

    card.classList.toggle("is-active", offset === 0);
    card.classList.toggle("is-hidden", hidden);
    card.setAttribute("aria-current", offset === 0 ? "true" : "false");
    card.style.transform = `translate3d(calc(-50% + ${translate}px), ${translateY}px, 0) scale(${scale})`;
    card.style.opacity = hidden ? "0" : `${opacity}`;
    card.style.filter = `blur(${blur}px) saturate(${offset === 0 ? 1 : 0.84})`;
    card.style.zIndex = `${20 - Math.abs(offset)}`;
    card.style.pointerEvents = hidden ? "none" : "auto";
    card.style.transitionDuration = prefersReducedMotion ? "0ms" : "";
  });

  movieRanges.forEach((range, index) => {
    range.classList.toggle("is-active", index === selectedIndex);
  });

  timelineTrack.style.transform = `translate3d(${translateX}px, 0, 0)`;
  activeTitleText.textContent = activeMovie.title;
  activePeriodText.textContent = activeMovie.period;
  activeYearText.textContent = formatYearRange(
    activeMovie.settingStart,
    activeMovie.settingEnd,
  );
  activeFocusText.textContent = activeMovie.historicalFocus;
  activeReleaseText.textContent = `개봉 ${activeMovie.releaseYear}`;

  const posterMetrics = getActivePosterMetrics();
  if (posterMetrics && activeDetail) {
    const detailTop = posterMetrics.posterBottom + 44;
    activeDetail.style.top = `${detailTop}px`;
  }

  drawConnector();
  preloadAdjacentPosters();
  updateAnnouncement();
};

const moveSelection = (direction: number) => {
  selectedIndex = clampIndex(selectedIndex + direction);
  updateScene();
};

const mount = () => {
  syncMotionPreference();
  render();
  bindDom();
  updateScene();
};

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveSelection(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveSelection(1);
  }

  if (event.key === "Home") {
    event.preventDefault();
    selectedIndex = 0;
    updateScene();
  }

  if (event.key === "End") {
    event.preventDefault();
    selectedIndex = currentMovies.length - 1;
    updateScene();
  }
});

window.addEventListener("resize", () => {
  mount();
});

window
  .matchMedia("(prefers-reduced-motion: reduce)")
  .addEventListener("change", () => {
    syncMotionPreference();
    updateScene();
  });

mount();
