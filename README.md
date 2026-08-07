# 경기대학교 교직이수 플랫폼 — 배포 가이드

이 폴더에는 사이트를 GitHub + Vercel로 무료 배포하는 데 필요한 파일이 모두 들어 있습니다.

```
index.html       ← 실제 사이트 (기존 platform_v20working_v12.html)
api/chat.js      ← AI 진로 상담 기능 (필수)
api/visit.js     ← 누적 방문자 카운터 (선택)
package.json
.gitignore
.env.example
```

AI 상담 기능은 학생 브라우저가 아니라 `api/chat.js`(서버)에서 OpenAI를 호출하도록
이미 만들어져 있습니다. 즉, **API 키가 사이트 방문자에게 절대 노출되지 않습니다.**
키는 아래 3단계에서 Vercel 대시보드에만 입력하세요 — 코드나 GitHub, 채팅창 등
어디에도 직접 붙여넣지 마세요.

---

## 1단계 — GitHub에 레포지토리 만들기

1. https://github.com 접속 → 로그인 → 우측 상단 `+` → **New repository**
2. 이름 입력 (예: `gyojik-platform`) → Public/Private 아무거나 선택 → **Create repository**
3. 방금 만든 빈 레포 페이지에서 **uploading an existing file** 링크 클릭
4. 이 폴더 안의 파일 전체(`index.html`, `api` 폴더, `package.json`, `.gitignore`, `.env.example`)를
   그대로 끌어다 놓기 → **Commit changes**

   (git을 쓸 줄 아신다면 터미널에서 `git init && git add . && git commit -m "init" && git remote add origin <레포 URL> && git push -u origin main` 도 동일합니다.)

## 2단계 — Vercel에 배포하기

1. https://vercel.com 접속 → **Continue with GitHub**로 로그인 (같은 GitHub 계정 사용)
2. **Add New → Project** → 방금 만든 레포 선택 → **Import**
3. Framework Preset은 자동으로 "Other"(정적 사이트)로 잡히면 됩니다. 별도 빌드 설정 필요 없음.

## 3단계 — OpenAI 키 등록 (가장 중요)

1. Import 화면(또는 배포 후 프로젝트 → **Settings → Environment Variables**)에서
2. Key: `OPENAI_API_KEY`
3. Value: 본인의 `sk-...` 키 붙여넣기
4. Environment는 Production/Preview/Development 모두 체크
5. **Save** → (이미 배포됐다면) 우측 상단 **Deployments → 최신 배포 → ... → Redeploy**

이제 **Deploy** 버튼을 누르면 1~2분 안에 `https://프로젝트이름.vercel.app` 주소가
생기고, 그 주소로 누구나 접속해 AI 진로 상담 기능까지 정상적으로 쓸 수 있습니다.

---

## (선택) 누적 방문자 카운터 켜기

`api/visit.js`는 Vercel의 KV(Upstash Redis) 저장소가 있어야 동작합니다.
연결하지 않아도 사이트는 문제없이 작동하고, 방문자 배지만 자동으로 숨겨집니다.

켜고 싶다면:
1. Vercel 프로젝트 → **Storage** 탭 → **Create Database** → **KV** 선택 → 프로젝트에 연결
2. 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 자동으로 추가됩니다
3. 다시 **Redeploy**

---

## 비용 안전장치 (꼭 확인하세요)

이 사이트는 누구나 접속해서 AI 상담을 쓸 수 있는 **공개 사이트**가 됩니다.
`api/chat.js`에 분당 요청 수를 제한하는 간단한 장치를 넣어뒀지만, 이것만으로
완벽한 방어는 아닙니다. 다음을 꼭 함께 설정해두는 걸 권장합니다.

- OpenAI 대시보드(https://platform.openai.com/settings/organization/limits)에서
  **월 사용 한도(budget limit)** 를 설정하고, 사용량 알림 이메일을 켜두세요.
- 필요하면 `api/chat.js`의 `RATE_LIMIT_MAX`(현재 분당 8회) 값을 더 낮춰도 됩니다.
- 사용자가 급증하면 Vercel의 Firewall/Rate Limiting 기능(유료 플랜)도 고려할 수 있습니다.

## 나중에 내용을 수정하고 싶다면

`index.html`을 수정한 뒤 GitHub 레포에 다시 업로드(또는 `git push`)하면,
Vercel이 자동으로 몇 초~몇 분 안에 재배포합니다. 별도 작업이 필요 없습니다.
