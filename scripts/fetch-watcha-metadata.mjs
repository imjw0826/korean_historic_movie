import { writeFile } from "node:fs/promises";

const titles = [
  "황산벌",
  "무영검",
  "평양성",
  "안시성",
  "무사",
  "쌍화점",
  "협녀, 칼의 기억",
  "영원한 제국",
  "춘향뎐",
  "취화선",
  "스캔들 - 조선남녀상열지사",
  "청풍명월",
  "혈의 누",
  "천군",
  "왕의 남자",
  "음란서생",
  "황진이",
  "궁녀",
  "신기전",
  "1724 기방난동사건",
  "미인도",
  "구르믈 버서난 달처럼",
  "방자전",
  "조선명탐정: 각시투구꽃의 비밀",
  "혈투",
  "최종병기 활",
  "후궁: 제왕의 첩",
  "동학, 수운 최제우",
  "나는 왕이로소이다",
  "바람과 함께 사라지다",
  "광해, 왕이 된 남자",
  "관상",
  "역린",
  "군도: 민란의 시대",
  "명량",
  "해적: 바다로 간 산적",
  "상의원",
  "어우동: 주인 없는 꽃",
  "조선명탐정: 사라진 놉의 딸",
  "순수의 시대",
  "간신",
  "사도",
  "조선마술사",
  "봉이 김선달",
  "고산자, 대동여지도",
  "임금님의 사건수첩",
  "대립군",
  "남한산성",
  "역모 - 반란의 시대",
  "흥부: 글로 세상을 바꾼 자",
  "궁합",
  "조선명탐정: 흡혈괴마의 비밀",
  "물괴",
  "명당",
  "나랏말싸미",
  "광대들: 풍문조작단",
  "천문: 하늘에 묻는다",
  "소리꾼",
  "검객",
  "자산어보",
  "한산: 용의 출현",
  "올빼미",
  "탄생",
  "살수",
  "연악: 나의 운명",
  "노량: 죽음의 바다",
  "전,란",
  "지충일기",
  "바얌섬",
  "왕과 사는 남자",
  "이재수의 난",
  "아나키스트",
  "기담",
  "좋은 놈, 나쁜 놈, 이상한 놈",
  "다찌마와 리: 악인이여 지옥행 급행열차를 타라",
  "모던보이",
  "그림자 살인",
  "불꽃처럼 나비처럼",
  "마이웨이",
  "가비",
  "경성학교: 사라진 소녀들",
  "암살",
  "도리화가",
  "대호",
  "동주",
  "해어화",
  "아가씨",
  "덕혜옹주",
  "밀정",
  "귀향, 끝나지 않은 이야기",
  "박열",
  "군함도",
  "대장 김창수",
  "말모이",
  "자전차왕 엄복동",
  "봉오동 전투",
  "영웅",
  "유령",
  "만해 한용운 님의침묵",
  "하얼빈",
  "말죽거리 잔혹사",
  "하얀전쟁",
  "증발",
  "태백산맥",
  "아름다운 청년 전태일",
  "꽃잎",
  "살인의 추억",
  "태극기 휘날리며",
  "실미도",
  "효자동 이발사",
  "그때 그 사람들",
  "웰컴 투 동막골",
  "그놈 목소리",
  "화려한 휴가",
  "님은 먼 곳에",
  "작은 연못",
  "포화속으로",
  "고지전",
  "범죄와의 전쟁: 나쁜놈들 전성시대",
  "남영동1985",
  "변호인",
  "국제시장",
  "연평해전",
  "오빠생각",
  "인천상륙작전",
  "더 킹",
  "택시운전사",
  "1987",
  "공작",
  "국가부도의 날",
  "스윙키즈",
  "장사리: 잊혀진 영웅들",
  "남산의 부장들",
  "이웃사촌",
  "모가디슈",
  "태일이",
  "킹메이커",
  "헌트",
  "교섭",
  "비공식작전",
  "1947 보스톤",
  "서울의 봄",
  "하이재킹",
  "행복의 나라",
];

const outputPath = new URL("../watcha-metadata.json", import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTitle = (value) =>
  value.replace(/[^\p{Script=Hangul}\p{Script=Han}\p{Number}\p{Letter}]/gu, "").trim();

const fetchText = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return (await response.text()).replace(/\0/g, "");
};

const findContentLink = (html, title) => {
  const itemPattern =
    /<a title="([^"]+)" class="InnerPartOfListWithImage[\s\S]{0,500}?href="([^"]+)"[\s\S]{0,1200}?<div class="_subtitle[^"]*">([^<]*)<\/div>/g;

  const candidates = [];

  for (const match of html.matchAll(itemPattern)) {
    candidates.push({
      title: match[1].trim(),
      href: match[2],
      subtitle: match[3].trim(),
    });
  }

  const normalizedQuery = normalizeTitle(title);

  const exactKorean = candidates.find(
    (candidate) =>
      normalizeTitle(candidate.title) === normalizedQuery &&
      candidate.subtitle.includes("한국"),
  );

  if (exactKorean) {
    return exactKorean.href;
  }

  const exact = candidates.find(
    (candidate) => normalizeTitle(candidate.title) === normalizedQuery,
  );

  if (exact) {
    return exact.href;
  }

  const partialKorean = candidates.find(
    (candidate) =>
      normalizeTitle(candidate.title).includes(normalizedQuery) &&
      candidate.subtitle.includes("한국"),
  );

  if (partialKorean) {
    return partialKorean.href;
  }

  return null;
};

const parseDetail = (html) => {
  const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? null;
  const poster = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? null;

  return { title, poster };
};

const results = [];

for (const title of titles) {
  try {
    console.error(`fetching: ${title}`);
    const searchUrl = `https://pedia.watcha.com/ko-KR/searches/movies?query=${encodeURIComponent(title)}`;
    const searchHtml = await fetchText(searchUrl);
    const href = findContentLink(searchHtml, title);

    if (!href) {
      results.push({ title, ok: false, reason: "search_no_exact_match" });
      continue;
    }

    const detailUrl = `https://pedia.watcha.com${href}`;
    const detailHtml = await fetchText(detailUrl);
    const detail = parseDetail(detailHtml);

    if (!detail.poster) {
      results.push({ title, ok: false, href: detailUrl, reason: "missing_poster_meta" });
      continue;
    }

    results.push({
      title,
      ok: true,
      href: detailUrl,
      poster: detail.poster,
      ogTitle: detail.title,
    });
  } catch (error) {
    results.push({
      title,
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  await writeFile(outputPath, JSON.stringify({ partial: true, results }, null, 2));
  await sleep(250);
}

const summary = {
  fetchedAt: new Date().toISOString(),
  total: results.length,
  success: results.filter((entry) => entry.ok).length,
  failed: results.filter((entry) => !entry.ok).length,
  results,
};

await writeFile(outputPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
