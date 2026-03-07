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
let trackWidth = 9600;
const trackPadding = 180;
let posterCards: HTMLAnchorElement[] = [];
let moviePins: HTMLButtonElement[] = [];
let movieRanges: HTMLElement[] = [];
let timelineTrack: HTMLElement | null = null;
let periodText: HTMLElement | null = null;
let yearText: HTMLElement | null = null;
let focusText: HTMLElement | null = null;

const clampIndex = (index: number) =>
  Math.max(0, Math.min(index, sortedMovies.length - 1));

const yearToRatio = (year: number) =>
  (year - timelineRange.start) / (timelineRange.end - timelineRange.start);

const yearToTrackX = (year: number) =>
  trackPadding + yearToRatio(year) * (trackWidth - trackPadding * 2);

const getOffsetX = (offset: number) => {
  const nearStep = Math.min(292, window.innerWidth * 0.29);
  const farStep = Math.min(428, window.innerWidth * 0.42);

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
    return 0.72;
  }

  return 0.48;
};

const getOffsetOpacity = (offset: number) => {
  if (offset === 0) {
    return 1;
  }

  if (Math.abs(offset) === 1) {
    return 0.74;
  }

  return 0.16;
};

const getOffsetBlur = (offset: number) => {
  if (offset === 0) {
    return 0;
  }

  if (Math.abs(offset) === 1) {
    return 0.5;
  }

  return 1.8;
};

const syncMeasurements = () => {
  trackWidth = Math.max(
    window.innerWidth * 5.6,
    (timelineRange.end - timelineRange.start) * 6.2,
    sortedMovies.length * 84,
    9600,
  );
};

const createPosterMarkup = () =>
  sortedMovies
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
          <div class="poster-copy">
            <strong>${movie.title}</strong>
            <span>${movie.releaseYear} · ${movie.period}</span>
            <small>${movie.historicalFocus}</small>
          </div>
        </a>
      `;
    })
    .join("");

const createEventMarkup = () =>
  timelineEvents
    .map(
      (event) => `
        <div
          class="timeline-event"
          style="left: ${yearToTrackX(event.year)}px"
        >
          <span class="timeline-event__dot"></span>
          <span class="timeline-event__line"></span>
          <span class="timeline-event__label">${event.label}</span>
        </div>
      `,
    )
    .join("");

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

const createPinMarkup = () =>
  sortedMovies
    .map((movie, index) => {
      const midpoint = (movie.settingStart + movie.settingEnd) / 2;
      const startX = yearToTrackX(movie.settingStart);
      const endX = yearToTrackX(movie.settingEnd);
      const rangeWidth = Math.max(endX - startX, 18);

      return `
        <button
          type="button"
          class="movie-pin"
          data-pin-index="${index}"
          style="left: ${yearToTrackX(midpoint)}px"
          aria-label="${movie.title} 선택"
        ></button>
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
        <p class="page-header__eyebrow">한국 역사영화</p>
        <h1>${siteMeta.title}</h1>
        <p class="page-header__credit">
          만든 사람 ${siteMeta.authorName}
          <a href="${siteMeta.githubUrl}" target="_blank" rel="noreferrer noopener">
            ${siteMeta.githubLabel}
          </a>
        </p>
        <p class="page-header__description">${siteMeta.description}</p>
      </header>

      <section class="timeline-full" aria-label="한국 역사영화 타임라인">
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

          <button
            type="button"
            class="carousel-arrow carousel-arrow--right"
            data-direction="next"
            aria-label="다음 영화"
          >
            →
          </button>
        </div>

        <div class="timeline-meta">
          <span class="timeline-meta__period" data-period></span>
          <strong class="timeline-meta__year" data-year></strong>
          <span class="timeline-meta__focus" data-focus></span>
        </div>

        <div class="timeline-rail">
          <div class="timeline-track" data-track style="width: ${trackWidth}px">
            <div class="timeline-line"></div>
            ${createCenturyMarkup()}
            ${createPinMarkup()}
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
  moviePins = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-pin-index]"),
  );
  movieRanges = Array.from(
    document.querySelectorAll<HTMLElement>("[data-range-index]"),
  );
  timelineTrack = document.querySelector<HTMLElement>("[data-track]");
  periodText = document.querySelector<HTMLElement>("[data-period]");
  yearText = document.querySelector<HTMLElement>("[data-year]");
  focusText = document.querySelector<HTMLElement>("[data-focus]");

  if (!timelineTrack || !periodText || !yearText || !focusText) {
    throw new Error("Timeline UI was not initialized.");
  }

  document.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      moveSelection(button.dataset.direction === "next" ? 1 : -1);
    });
  });

  moviePins.forEach((pin, index) => {
    pin.addEventListener("click", () => {
      selectedIndex = clampIndex(index);
      updateScene();
    });
  });
};

const updateScene = () => {
  if (!timelineTrack || !periodText || !yearText || !focusText) {
    return;
  }

  const activeMovie = sortedMovies[selectedIndex];
  const activeMidpoint = (activeMovie.settingStart + activeMovie.settingEnd) / 2;
  const centerX = window.innerWidth / 2;
  const activeX = yearToTrackX(activeMidpoint);
  const translateX = centerX - activeX;

  posterCards.forEach((card, index) => {
    const offset = index - selectedIndex;
    const clampedOffset = Math.max(-2, Math.min(2, offset));
    const hidden = Math.abs(offset) > 2;
    const translate = getOffsetX(clampedOffset);
    const translateY = Math.abs(clampedOffset) * 24;
    const scale = getOffsetScale(clampedOffset);
    const opacity = getOffsetOpacity(clampedOffset);
    const blur = getOffsetBlur(clampedOffset);

    card.classList.toggle("is-active", offset === 0);
    card.classList.toggle("is-hidden", hidden);
    card.style.transform = `translate3d(calc(-50% + ${translate}px), ${translateY}px, 0) scale(${scale})`;
    card.style.opacity = hidden ? "0" : `${opacity}`;
    card.style.filter = `blur(${blur}px) saturate(${offset === 0 ? 1 : 0.84})`;
    card.style.zIndex = `${20 - Math.abs(offset)}`;
    card.style.pointerEvents = hidden ? "none" : "auto";
  });

  moviePins.forEach((pin, index) => {
    pin.classList.toggle("is-active", index === selectedIndex);
  });

  movieRanges.forEach((range, index) => {
    range.classList.toggle("is-active", index === selectedIndex);
  });

  timelineTrack.style.transform = `translate3d(${translateX}px, 0, 0)`;
  periodText.textContent = activeMovie.period;
  yearText.textContent = formatYearRange(
    activeMovie.settingStart,
    activeMovie.settingEnd,
  );
  focusText.textContent = activeMovie.historicalFocus;
};

const moveSelection = (direction: number) => {
  selectedIndex = clampIndex(selectedIndex + direction);
  updateScene();
};

const mount = () => {
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
});

window.addEventListener("resize", () => {
  mount();
});

mount();
