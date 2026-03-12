# korean_historic_movie

한국 사극·역사영화를 시대 배경 기준으로 보여주는 TypeScript 타임라인 웹사이트입니다.

## 실행

```bash
npm install
npm run dev
```

## 배포

```bash
npm run build
```

- GitHub Pages 배포본은 `docs/`에 둡니다.
- Vite `base`는 `/korean_historic_movie/`로 맞춰져 있습니다.

## 구조

```text
.
├── index.html
├── plan.md
├── yearly-movie-list.md
├── watcha-verification.md
├── scripts
│   ├── build-catalog.mjs
│   ├── fetch-watcha-metadata.mjs
│   └── verify-catalog.mjs
├── src
│   ├── catalog.json
│   ├── data.ts
│   ├── main.ts
│   └── style.css
├── public
│   └── fallback-poster-ghost.svg
├── docs
│   └── ...
└── dist
    └── ...
```
