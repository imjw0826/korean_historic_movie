import { readFile, writeFile } from "node:fs/promises";

const htmlPath = "/tmp/namu-korean-historical-movies.html";
const metadataPath = new URL("../watcha-metadata.json", import.meta.url);
const catalogPath = new URL("../src/catalog.json", import.meta.url);
const yearlyListPath = new URL("../yearly-movie-list.md", import.meta.url);

const timeline = (settingStart, settingEnd, period, historicalFocus) => ({
  settingStart,
  settingEnd,
  period,
  historicalFocus,
});

const metadataOverrides = {
  영웅: {
    link: "https://pedia.watcha.com/ko-KR/contents/m5QAqBR",
    posterUrl:
      "https://an2-img.amz.wtchn.net/image/v2/smHvq55QsSby2GD_Er3kew.jpg?jwt=ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKdmNIUnpJanBiSW1SZk5Ea3dlRGN3TUhFNE1DSmRMQ0p3SWpvaUwzWXlMM04wYjNKbEwybHRZV2RsTHpFMk56RTBORFl3TnpZeU9EQTJPVGd5TnpjaWZRLmx2cFJUTFprUnljRHRubHVMUWFaSjRqNEZMVUJHSlROQTFicy1lOENQNzA=",
    source: "watcha-detail",
    note: "수동 보정",
  },
  "작은 연못": {
    link: "https://pedia.watcha.com/ko-KR/contents/mdj0QqW",
    posterUrl:
      "https://an2-img.amz.wtchn.net/image/v2/h-L1Rh2Yvg4gYb91jYwFhw.jpg?jwt=ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKdmNIUnpJanBiSW1SZk5Ea3dlRGN3TUhFNE1DSmRMQ0p3SWpvaUwzWXhMM1Y2ZEdoMmN6UjJPVGhpTVRKdmFXZzBlWEkySW4wLm1sekx2LS1lVkFvTGpsVWMwOXBGeFRURzFlRFRkcXR1N19tLTlZVGxvWjA=",
    source: "watcha-detail",
    note: "수동 보정",
  },
  증발: {
    link: "https://pedia.watcha.com/ko-KR/contents/mdMvvX5",
    posterUrl:
      "https://an2-img.amz.wtchn.net/image/v2/a56SsdrWI0ca6PJtUkKItA.jpg?jwt=ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKdmNIUnpJanBiSW1SZk5Ea3dlRGN3TUhFNE1DSmRMQ0p3SWpvaUwzWXlMM04wYjNKbEwybHRZV2RsTHpFNE1EYzFNek14TmpjMU16STNOU0o5LjQwZi1tU3VvcUV4enFEblFnaWk5RzZxd2NDbXZyWk1xNzdONTNPaUtYbTg=",
    source: "watcha-detail",
    note: "수동 보정",
  },
  "YMCA 야구단": {
    link: "https://pedia.watcha.com/ko-KR/contents/mDWvGMO",
    posterUrl:
      "https://an2-img.amz.wtchn.net/image/v2/P6hm6SU8qe4reN2IvBItfA.jpg?jwt=ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKdmNIUnpJanBiSW1SZk5Ea3dlRGN3TUhFNE1DSmRMQ0p3SWpvaUwzWXhMMkV5TUdkd2NHaDZkbmxsTm5CemVtODVhbTB6SW4wLmRKQlBEbi0tSUJRNHZvWlJYM1VHZkE2N05ISGdpaFQ1dG1lQ1dzV015Q00=",
    source: "watcha-detail",
    note: "수동 추가",
  },
  "라듸오 데이즈": {
    link: "https://pedia.watcha.com/ko-KR/contents/mMO2r8O",
    posterUrl:
      "https://an2-img.amz.wtchn.net/image/v2/dsha1zKJhczMBqqRAgG2iA.jpg?jwt=ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKdmNIUnpJanBiSW1SZk5Ea3dlRGN3TUhFNE1DSmRMQ0p3SWpvaUwzWXhMMnQ2WlRaNGVXRTVZMnd6TjJnNFpHUjVZblIxSW4wLlZqYUYxRHpjOEV1X2dTNlZJcUFod1c5aFRxVURpci1iUGJvejZ6dGh4TUk=",
    source: "watcha-detail",
    note: "수동 추가",
  },
  유령: {
    link: "https://pedia.watcha.com/ko-KR/searches/movies?query=%EC%9C%A0%EB%A0%B9",
    posterUrl: "/fallback-poster-ghost.svg",
    source: "watcha-search-fallback",
    note: "왓챠 상세 페이지 미확인",
  },
};

const timelineOverrides = {
  황산벌: timeline(660, 660, "백제 말기", "황산벌 전투"),
  무영검: timeline(926, 927, "발해 말기", "발해 멸망 이후의 혼란"),
  평양성: timeline(668, 668, "고구려 말기", "평양성 함락 직전"),
  안시성: timeline(645, 645, "고구려", "안시성 전투"),
  무사: timeline(1375, 1375, "고려 말기", "공민왕 이후 외교 사행"),
  쌍화점: timeline(1372, 1374, "고려 말기", "공민왕 말년의 궁정 갈등"),
  "협녀, 칼의 기억": timeline(1356, 1363, "고려 말기", "권문세족과 검객 서사"),
  "영원한 제국": timeline(1801, 1801, "조선 후기", "정조 사후 남인 탄압"),
  춘향뎐: timeline(1750, 1750, "조선 후기", "고전 설화를 바탕으로 한 남원 이야기"),
  취화선: timeline(1850, 1885, "조선 후기", "화가 장승업의 생애"),
  "스캔들 - 조선남녀상열지사": timeline(1700, 1700, "조선 후기", "양반 사회의 욕망과 위선"),
  청풍명월: timeline(1628, 1628, "조선 중기", "무사들의 복수와 우정"),
  "혈의 누": timeline(1808, 1808, "조선 후기", "조선 후기 살인 사건"),
  천군: timeline(1572, 1572, "조선 중기", "젊은 이순신과의 조우"),
  "왕의 남자": timeline(1506, 1506, "연산군기", "궁중 광대극과 연산군"),
  음란서생: timeline(1668, 1668, "조선 후기", "금서와 필화의 궁중 소동"),
  황진이: timeline(1540, 1558, "조선 중기", "황진이의 삶과 예술"),
  궁녀: timeline(1795, 1795, "조선 후기", "궁중 미스터리"),
  신기전: timeline(1448, 1448, "조선 전기", "세종대 화포 개발"),
  "1724 기방난동사건": timeline(1724, 1724, "조선 후기", "영조 즉위 무렵의 한양 소동"),
  미인도: timeline(1790, 1795, "조선 후기", "신윤복을 둘러싼 해석"),
  "구르믈 버서난 달처럼": timeline(1592, 1592, "조선 중기", "임진왜란 직전의 혼란"),
  방자전: timeline(1750, 1750, "조선 후기", "춘향전의 변주"),
  "조선명탐정: 각시투구꽃의 비밀": timeline(1785, 1785, "조선 후기", "정조대 연쇄 사건"),
  혈투: timeline(1619, 1619, "광해군기", "압록강 부근 전쟁과 생존"),
  "최종병기 활": timeline(1636, 1636, "조선 중기", "병자호란"),
  "후궁: 제왕의 첩": timeline(1636, 1636, "조선 중기", "인조대 궁중 권력극"),
  "동학, 수운 최제우": timeline(1860, 1864, "조선 후기", "동학 창도"),
  "나는 왕이로소이다": timeline(1418, 1418, "조선 전기", "충녕대군과 세자 책봉"),
  "바람과 함께 사라지다": timeline(1862, 1862, "조선 후기", "서빙고 얼음을 둘러싼 소동"),
  "광해, 왕이 된 남자": timeline(1616, 1616, "광해군기", "대역과 광해군"),
  관상: timeline(1453, 1453, "조선 전기", "계유정난"),
  역린: timeline(1777, 1777, "조선 후기", "정조 즉위 초 암살 음모"),
  "군도: 민란의 시대": timeline(1862, 1862, "조선 후기", "임술민란"),
  명량: timeline(1597, 1597, "조선 중기", "명량 해전"),
  "해적: 바다로 간 산적": timeline(1392, 1392, "조선 건국기", "건국 직전 국새 소동"),
  상의원: timeline(1748, 1748, "조선 후기", "왕실 의복과 장인의 경쟁"),
  "어우동: 주인 없는 꽃": timeline(1480, 1480, "조선 전기", "어우동 스캔들"),
  "조선명탐정: 사라진 놉의 딸": timeline(1795, 1795, "조선 후기", "정조대 실종 사건"),
  "순수의 시대": timeline(1398, 1398, "조선 건국기", "왕자의 난 전후 권력투쟁"),
  간신: timeline(1505, 1506, "연산군기", "연산군 폭정"),
  사도: timeline(1762, 1762, "조선 후기", "사도세자의 죽음"),
  조선마술사: timeline(1638, 1638, "조선 중기", "청나라 공녀와 마술사"),
  "봉이 김선달": timeline(1650, 1650, "조선 후기", "김선달 설화"),
  "고산자, 대동여지도": timeline(1861, 1866, "조선 후기", "김정호와 대동여지도"),
  "임금님의 사건수첩": timeline(1469, 1469, "조선 전기", "예종대 궁중 수사"),
  대립군: timeline(1592, 1592, "조선 중기", "분조와 임진왜란"),
  남한산성: timeline(1636, 1637, "조선 중기", "병자호란과 남한산성"),
  "역모 - 반란의 시대": timeline(1728, 1728, "조선 후기", "이인좌의 난"),
  "흥부: 글로 세상을 바꾼 자": timeline(1830, 1830, "조선 후기", "고전 설화의 재해석"),
  궁합: timeline(1750, 1750, "조선 후기", "혼인과 궁합을 둘러싼 로맨스"),
  "조선명탐정: 흡혈괴마의 비밀": timeline(1795, 1795, "조선 후기", "정조대 괴담 수사"),
  물괴: timeline(1527, 1527, "조선 중기", "중종대 괴수 소동"),
  명당: timeline(1860, 1868, "조선 후기", "풍수와 흥선대원군"),
  나랏말싸미: timeline(1443, 1446, "조선 전기", "훈민정음 창제"),
  "광대들: 풍문조작단": timeline(1455, 1457, "조선 전기", "세조와 한명회의 미담 조작"),
  "천문: 하늘에 묻는다": timeline(1442, 1448, "조선 전기", "세종과 장영실"),
  소리꾼: timeline(1867, 1867, "조선 후기", "판소리와 민초의 삶"),
  검객: timeline(1623, 1623, "조선 중기", "광해군 폐위 직후"),
  자산어보: timeline(1811, 1811, "조선 후기", "정약전의 유배와 기록"),
  "한산: 용의 출현": timeline(1592, 1592, "조선 중기", "한산도 대첩"),
  올빼미: timeline(1645, 1645, "조선 중기", "소현세자 죽음"),
  탄생: timeline(1845, 1846, "조선 후기", "김대건 신부"),
  살수: timeline(612, 612, "고구려", "살수대첩"),
  "연악: 나의 운명": timeline(1430, 1445, "조선 전기", "세종대 음악가 박연의 악률 정비"),
  "노량: 죽음의 바다": timeline(1598, 1598, "조선 중기", "노량 해전"),
  "전,란": timeline(1592, 1593, "조선 중기", "임진왜란 전란기"),
  지충일기: timeline(1791, 1791, "조선 후기", "윤지충과 천주교 박해"),
  바얌섬: timeline(1592, 1598, "조선 중기", "전쟁에 나선 조선 수군의 표류"),
  "왕과 사는 남자": timeline(1457, 1457, "조선 전기", "단종 유배와 엄흥도의 보호"),
  "이재수의 난": timeline(1901, 1901, "대한제국기", "제주 민란"),
  아나키스트: timeline(1930, 1930, "일제강점기", "상하이 독립운동"),
  "YMCA 야구단": timeline(1905, 1905, "대한제국기", "근대 야구와 개화기"),
  기담: timeline(1942, 1942, "일제강점기", "경성의 병원 괴담"),
  "라듸오 데이즈": timeline(1938, 1938, "일제강점기", "경성 라디오 방송국"),
  "좋은 놈, 나쁜 놈, 이상한 놈": timeline(1939, 1939, "일제강점기", "만주 활극"),
  "다찌마와 리: 악인이여 지옥행 급행열차를 타라": timeline(1940, 1940, "일제강점기", "첩보 활극"),
  모던보이: timeline(1937, 1937, "일제강점기", "경성의 모던 보이와 독립운동"),
  "그림자 살인": timeline(1910, 1910, "대한제국기", "근대 초 수사극"),
  "불꽃처럼 나비처럼": timeline(1895, 1895, "대한제국기", "명성황후 시해 전후"),
  마이웨이: timeline(1938, 1944, "일제강점기", "일제강점기와 2차대전"),
  가비: timeline(1896, 1896, "대한제국기", "고종 암살 음모"),
  "경성학교: 사라진 소녀들": timeline(1938, 1938, "일제강점기", "경성 기숙학교의 비밀"),
  암살: timeline(1933, 1933, "일제강점기", "경성·상하이 암살 작전"),
  도리화가: timeline(1867, 1867, "조선 후기", "진채선과 판소리"),
  대호: timeline(1925, 1925, "일제강점기", "조선 마지막 호랑이"),
  동주: timeline(1945, 1945, "일제강점기", "윤동주와 청춘"),
  해어화: timeline(1943, 1943, "일제강점기", "경성 기생과 유행가"),
  아가씨: timeline(1935, 1935, "일제강점기", "식민지 조선을 배경으로 한 사기극"),
  덕혜옹주: timeline(1925, 1945, "일제강점기", "덕혜옹주의 유학과 망명 시도"),
  밀정: timeline(1923, 1923, "일제강점기", "의열단 작전"),
  "귀향, 끝나지 않은 이야기": timeline(1943, 1945, "일제강점기", "일본군 위안부 피해"),
  박열: timeline(1923, 1923, "일제강점기", "박열과 후미코"),
  군함도: timeline(1945, 1945, "일제강점기", "하시마 섬 강제징용"),
  "대장 김창수": timeline(1896, 1896, "대한제국기", "김구의 청년기"),
  말모이: timeline(1941, 1942, "일제강점기", "조선어학회 사전 편찬"),
  "자전차왕 엄복동": timeline(1913, 1913, "일제강점기", "자전거 경주와 식민지 조선"),
  "봉오동 전투": timeline(1920, 1920, "일제강점기", "봉오동 전투"),
  영웅: timeline(1909, 1909, "대한제국기", "하얼빈 의거"),
  유령: timeline(1933, 1933, "일제강점기", "총독부 내부 첩보전"),
  "만해 한용운 님의침묵": timeline(1926, 1926, "일제강점기", "만해 한용운의 사상과 저항"),
  하얼빈: timeline(1909, 1909, "대한제국기", "안중근 의거"),
  "하얀전쟁": timeline(1969, 1969, "현대", "베트남 전쟁"),
  증발: timeline(1980, 1980, "현대", "현대사의 실종과 국가폭력"),
  태백산맥: timeline(1948, 1953, "현대", "여순과 한국전쟁"),
  "아름다운 청년 전태일": timeline(1970, 1970, "현대", "전태일 분신"),
  꽃잎: timeline(1980, 1980, "현대", "5.18 광주"),
  "살인의 추억": timeline(1986, 1991, "현대", "화성 연쇄살인"),
  "태극기 휘날리며": timeline(1950, 1953, "현대", "한국전쟁"),
  실미도: timeline(1968, 1971, "현대", "실미도 684부대"),
  "그때 그 사람들": timeline(1979, 1979, "현대", "10.26"),
  "웰컴 투 동막골": timeline(1950, 1950, "현대", "한국전쟁 속 산골 마을"),
  "그놈 목소리": timeline(1991, 1991, "현대", "이형호 유괴 사건"),
  "화려한 휴가": timeline(1980, 1980, "현대", "5.18 광주"),
  "님은 먼 곳에": timeline(1972, 1972, "현대", "베트남 전쟁과 위문 공연"),
  "작은 연못": timeline(1950, 1950, "현대", "노근리 사건"),
  포화속으로: timeline(1950, 1950, "현대", "포항 전투"),
  고지전: timeline(1953, 1953, "현대", "휴전 직전 고지전"),
  "범죄와의 전쟁: 나쁜놈들 전성시대": timeline(1982, 1990, "현대", "부산 암흑가와 군사정권 시기"),
  남영동1985: timeline(1985, 1985, "현대", "남영동 대공분실 고문"),
  변호인: timeline(1981, 1981, "현대", "부림사건"),
  국제시장: timeline(1950, 1983, "현대", "전후 세대의 한국 현대사"),
  연평해전: timeline(2002, 2002, "현대", "제2연평해전"),
  오빠생각: timeline(1951, 1951, "현대", "전쟁고아 합창단"),
  인천상륙작전: timeline(1950, 1950, "현대", "인천상륙작전"),
  "더 킹": timeline(1983, 2000, "현대", "권력과 정치 검찰사"),
  택시운전사: timeline(1980, 1980, "현대", "5.18 광주"),
  공작: timeline(1993, 1997, "현대", "북핵과 흑금성 작전"),
  "국가부도의 날": timeline(1997, 1997, "현대", "외환위기"),
  스윙키즈: timeline(1951, 1951, "현대", "거제 포로수용소"),
  "장사리: 잊혀진 영웅들": timeline(1950, 1950, "현대", "장사상륙작전"),
  "남산의 부장들": timeline(1979, 1979, "현대", "10.26과 중앙정보부"),
  이웃사촌: timeline(1985, 1985, "현대", "가택연금과 감시"),
  모가디슈: timeline(1991, 1991, "현대", "소말리아 내전과 대사관 탈출"),
  태일이: timeline(1970, 1970, "현대", "전태일 분신"),
  킹메이커: timeline(1969, 1971, "현대", "선거 전략과 야당 정치"),
  헌트: timeline(1983, 1983, "현대", "안기부 내부 첩보전"),
  교섭: timeline(2007, 2007, "현대", "아프가니스탄 피랍 사건"),
  비공식작전: timeline(1987, 1987, "현대", "레바논 외교관 구출"),
  "1947 보스톤": timeline(1947, 1947, "현대", "보스턴 마라톤"),
  "서울의 봄": timeline(1979, 1979, "현대", "12.12 군사반란"),
  하이재킹: timeline(1971, 1971, "현대", "여객기 납치 사건"),
  "행복의 나라": timeline(1979, 1979, "현대", "10.26 재판과 권력의 후폭풍"),
};

const displayTitleOverrides = {
  "교섭(영화)": "교섭",
};

const metadataKeyOverrides = {
  "교섭(영화)": "교섭",
};

const parseNamuList = (html) => {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2F;/g, "/")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  let section = "";
  const items = [];

  for (let index = 0; index < text.length; index += 1) {
    const line = text[index];

    if (/^1\.$/.test(line) && text[index + 1] === "삼국시대") {
      section = "삼국시대~남북국시대";
    }

    if (/^2\.$/.test(line) && text[index + 1] === "고려") {
      section = "고려";
    }

    if (/^3\.$/.test(line) && text[index + 1] === "조선") {
      section = "조선";
    }

    if (/^4\.$/.test(line) && text[index + 1] === "구한말") {
      section = "구한말~일제강점기";
    }

    if (/^5\.$/.test(line) && text[index + 1] === "현대") {
      section = "현대물";
    }

    const inlineMatch = line.match(/^(.*?)(?:\s+-\s+)(\d{4})(?:\b.*)?$/);
    if (inlineMatch && !line.startsWith("- ")) {
      const title = inlineMatch[1].trim();
      if (title) {
        items.push({ section, title, releaseYear: Number(inlineMatch[2]) });
        continue;
      }
    }

    const nextLine = text[index + 1];
    if (nextLine?.startsWith("- ")) {
      const yearMatch = nextLine.match(/-\s*(\d{4})/);
      if (yearMatch) {
        items.push({ section, title: line, releaseYear: Number(yearMatch[1]) });
      }
    }
  }

  const deduped = [];
  const seen = new Set();

  for (const item of items) {
    const key = `${item.title}|${item.releaseYear}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const main = async () => {
  const [html, metadataRaw] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(metadataPath, "utf8"),
  ]);

  const sourceItems = parseNamuList(html);
  const metadata = JSON.parse(metadataRaw).results;
  const metadataByTitle = new Map(
    metadata.filter((item) => item.ok).map((item) => [item.title, item]),
  );

  const movies = sourceItems.map((item) => {
    const title = displayTitleOverrides[item.title] ?? item.title;
    const metadataKey = metadataKeyOverrides[item.title] ?? title;
    const metadataOverride = metadataOverrides[title];
    const metadataItem = metadataOverride ?? metadataByTitle.get(metadataKey);
    const timelineItem = timelineOverrides[title];

    if (!timelineItem) {
      throw new Error(`Timeline mapping is missing for "${title}".`);
    }

    if (!metadataItem) {
      throw new Error(`Watcha metadata is missing for "${title}".`);
    }

    return {
      id: slugify(`${item.releaseYear}-${title}`),
      title,
      releaseYear: item.releaseYear,
      section: item.section,
      settingStart: timelineItem.settingStart,
      settingEnd: timelineItem.settingEnd,
      period: timelineItem.period,
      historicalFocus: timelineItem.historicalFocus,
      description: `${timelineItem.period} · ${timelineItem.historicalFocus}`,
      link: metadataItem.link ?? metadataItem.href,
      posterUrl: metadataItem.posterUrl ?? metadataItem.poster,
      metadataSource: metadataOverride?.source ?? "watcha-search",
      verificationNote: metadataOverride?.note ?? "자동 매칭",
    };
  });

  movies.sort(
    (left, right) =>
      (left.settingStart + left.settingEnd) / 2 -
      (right.settingStart + right.settingEnd) / 2,
  );

  await writeFile(catalogPath, `${JSON.stringify(movies, null, 2)}\n`);

  const moviesByYear = new Map();
  for (const item of sourceItems) {
    const title = displayTitleOverrides[item.title] ?? item.title;
    const current = moviesByYear.get(item.releaseYear) ?? [];
    current.push(title);
    moviesByYear.set(item.releaseYear, current);
  }

  const yearlyMarkdown = [
    "# 연도별 한국 역사영화 목록",
    "",
    `- 기준 페이지: https://namu.wiki/w/%ED%95%9C%EA%B5%AD%20%EC%82%AC%EA%B7%B9/%EC%98%81%ED%99%94%20%EB%AA%A9%EB%A1%9D`,
    `- 총 편수: ${sourceItems.length}`,
    "",
  ];

  [...moviesByYear.entries()]
    .sort((left, right) => left[0] - right[0])
    .forEach(([year, titles]) => {
      yearlyMarkdown.push(`## ${year}`);
      titles.forEach((title) => yearlyMarkdown.push(`- ${title}`));
      yearlyMarkdown.push("");
    });

  await writeFile(yearlyListPath, `${yearlyMarkdown.join("\n").trim()}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
