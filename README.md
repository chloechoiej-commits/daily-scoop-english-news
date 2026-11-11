# Daily Scoop

중학생을 위한 영어 기사 읽기와 요약·단어·문법 학습 앱입니다. Supabase 미설정 시 직접 작성한 예시 학습 지문이 표시됩니다.

## 실행

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트 URL과 anon key를 입력합니다.
3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
4. Supabase Authentication에서 공개 회원가입을 비활성화하고 교사 계정을 직접 생성합니다.
5. `npm run dev`

Supabase 설정 후에는 데이터베이스에 등록된 기사만 표시됩니다. 교사 로그인 후 기사와 학습 자료를 등록할 수 있습니다. 학습 완료 및 작성한 요약은 현재 브라우저에 저장됩니다. 외부 기사를 등록할 때에는 저작권과 이용 허락을 확인하세요.

## GitHub Pages 배포

`master`에 push하면 GitHub Actions가 Pages에 자동 배포합니다. Supabase를 연결하려면 저장소의 Actions secrets에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 설정하고 워크플로를 다시 실행하세요. 이 값은 브라우저에 공개되므로 서비스 역할 키가 아닌 anon key만 사용하고, SQL의 RLS 정책을 유지해야 합니다. Secrets가 없으면 예시 모드로 배포됩니다.
