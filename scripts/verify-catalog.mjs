import { access, readFile, writeFile } from "node:fs/promises";

const catalogPath = new URL("../src/catalog.json", import.meta.url);
const reportPath = new URL("../watcha-verification.md", import.meta.url);
const workspaceRoot = new URL("../", import.meta.url);

const fetchStatus = async (url) => {
  if (url.startsWith("/")) {
    try {
      await access(new URL(`./public${url}`, workspaceRoot));
      return { ok: true, status: "local-ok" };
    } catch {
      return { ok: false, status: "local-missing" };
    }
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "user-agent": "Mozilla/5.0",
        "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });

    return {
      ok: response.ok,
      status: `${response.status}`,
    };
  } catch {
    return { ok: false, status: "error" };
  }
};

const runLimited = async (items, worker, limit = 8) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const run = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(Array.from({ length: limit }, run));
  return results;
};

const main = async () => {
  const movies = JSON.parse(await readFile(catalogPath, "utf8"));

  const results = await runLimited(
    movies,
    async (movie) => {
      const [linkResult, posterResult] = await Promise.all([
        fetchStatus(movie.link),
        fetchStatus(movie.posterUrl),
      ]);

      return { movie, linkResult, posterResult };
    },
    10,
  );

  const linkOk = results.filter((result) => result.linkResult.ok).length;
  const posterOk = results.filter((result) => result.posterResult.ok).length;

  const lines = [
    "# 왓챠 링크 및 포스터 검증",
    "",
    `- 검증 대상: ${results.length}편`,
    `- 링크 정상: ${linkOk}/${results.length}`,
    `- 포스터 정상: ${posterOk}/${results.length}`,
    "",
    "| 제목 | 링크 | 포스터 | 비고 |",
    "| --- | --- | --- | --- |",
  ];

  results.forEach(({ movie, linkResult, posterResult }) => {
    lines.push(
      `| ${movie.title} | ${linkResult.status} | ${posterResult.status} | ${movie.verificationNote} |`,
    );
  });

  await writeFile(reportPath, `${lines.join("\n")}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
