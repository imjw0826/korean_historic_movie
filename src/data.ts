import catalog from "./catalog.json";

export type Movie = {
  id: string;
  title: string;
  releaseYear: number;
  section: string;
  settingStart: number;
  settingEnd: number;
  period: string;
  historicalFocus: string;
  description: string;
  link: string;
  posterUrl: string;
  metadataSource: string;
  verificationNote: string;
};

export type TimelineEvent = {
  year: number;
  label: string;
};

export const siteMeta = {
  title: "한국 사극·역사영화 타임라인",
  description:
    "NamuWiki 목록을 기준으로 정리한 한국 역사영화 타임라인. 포스터를 누르면 왓챠피디아로 이동합니다.",
  authorName: "imjw0826",
  githubUrl: "https://github.com/imjw0826/korean_historic_movie",
  githubLabel: "github.com/imjw0826/korean_historic_movie",
} as const;

export const timelineRange = {
  start: 600,
  end: 2025,
} as const;

export const timelineEvents: TimelineEvent[] = [
  { year: 612, label: "살수대첩" },
  { year: 645, label: "안시성 전투" },
  { year: 660, label: "황산벌 전투" },
  { year: 668, label: "고구려 멸망" },
  { year: 918, label: "고려 건국" },
  { year: 1231, label: "몽골 침입" },
  { year: 1388, label: "위화도 회군" },
  { year: 1392, label: "조선 건국" },
  { year: 1418, label: "세종 즉위" },
  { year: 1443, label: "훈민정음 창제" },
  { year: 1453, label: "계유정난" },
  { year: 1506, label: "중종반정" },
  { year: 1592, label: "임진왜란" },
  { year: 1597, label: "명량 해전" },
  { year: 1636, label: "병자호란" },
  { year: 1728, label: "이인좌의 난" },
  { year: 1762, label: "사도세자 죽음" },
  { year: 1801, label: "신유박해" },
  { year: 1860, label: "동학 창도" },
  { year: 1862, label: "임술민란" },
  { year: 1895, label: "을미사변" },
  { year: 1905, label: "을사늑약" },
  { year: 1909, label: "하얼빈 의거" },
  { year: 1910, label: "강제병합" },
  { year: 1919, label: "3.1운동" },
  { year: 1920, label: "봉오동 전투" },
  { year: 1945, label: "광복" },
  { year: 1950, label: "한국전쟁" },
  { year: 1960, label: "4.19 혁명" },
  { year: 1970, label: "전태일 분신" },
  { year: 1979, label: "10.26 / 12.12" },
  { year: 1980, label: "5.18 광주" },
  { year: 1987, label: "6월 항쟁" },
  { year: 1997, label: "IMF 외환위기" },
  { year: 2002, label: "제2연평해전" },
];

const movies = catalog as Movie[];

const midpoint = (movie: Movie) => (movie.settingStart + movie.settingEnd) / 2;

export const sortedMovies = [...movies].sort(
  (left, right) => midpoint(left) - midpoint(right),
);

export const centuryMarks = Array.from(
  { length: Math.floor((timelineRange.end - timelineRange.start) / 100) + 1 },
  (_, index) => timelineRange.start + index * 100,
);

export const formatYear = (year: number) => `${year}년`;

export const formatYearRange = (start: number, end: number) =>
  start === end ? formatYear(start) : `${formatYear(start)} - ${formatYear(end)}`;
