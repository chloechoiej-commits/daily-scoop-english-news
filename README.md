# Daily Scoop

중학생을 위한 영어 기사 읽기와 요약·단어·문법 학습 앱입니다. Supabase 미설정 시 직접 작성한 예시 학습 지문이 표시됩니다.

## 실행

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트 URL과 anon key를 입력합니다.
3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
4. Supabase Authentication에서 공개 회원가입을 비활성화하고 교사 계정을 직접 생성합니다.
5. `npm run dev`

Supabase 설정 후에는 데이터베이스에 등록된 기사만 표시됩니다. 교사 로그인 후 기사와 학습 자료를 등록할 수도 있습니다. 홈에는 최근 기사 최대 5개가 표시됩니다. LEVEL 1~3은 학년 구분이 아닌 참고용 난이도입니다. 예시 모드의 다섯 지문은 링크된 보도를 참고해 새로 작성한 학습 자료이며 자동 갱신되지 않습니다. 학습 완료 및 작성한 요약은 현재 브라우저에 저장됩니다.

요약 피드백은 브라우저에서 단어 일치와 일부 영어 문장 규칙을 확인합니다. AI 평가가 아니며 의미, 정확성이나 모든 문법 오류를 판별하지 못합니다. 한국어 문법은 검사하지 않고 한국어 비교 자료가 없는 기사에서는 핵심 표현을 비교하지 않습니다.

## 매일 자동 수집

GitHub Actions가 한국 시간 매일 오전 8시경 TIME for Kids와 NewsForKids.net의 공개 RSS를 확인합니다. 최근 14일 이내 미등록 기사를 하루 최대 5건 가져오며, 수집된 기사 수가 적거나 피드에 새 기사가 없으면 5건보다 적을 수 있습니다. 발행일과 출처 링크를 보존하고 제목과 URL을 기준으로 중복을 줄입니다. GitHub 예약 작업은 지연될 수 있습니다. 단순 키워드 차단은 모든 부적절한 내용을 걸러내지 못하므로 교사의 검토가 필요합니다.

1. 기존 데이터베이스는 `supabase/migrations/20261111_daily_collection.sql`을 실행합니다. 새 데이터베이스는 `supabase/schema.sql`을 실행합니다.
2. GitHub Actions secrets에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 설정합니다. 서비스 역할 키는 서버 전용이며 절대 `VITE_` 변수나 소스 코드에 넣지 마세요. 프런트엔드는 별도로 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 필요합니다.
3. `Collect daily news` 워크플로를 수동 실행해 확인한 뒤 예약 실행을 사용합니다. 외부 출처의 RSS 이용 조건과 발췌·재작성에 대한 권리를 검토하세요.

기본 모드에서는 짧은 RSS 발췌문만 저장하고 전체 기사는 원문 링크로 읽습니다. 난이도는 단순 자동 추정이며 한국어 요약·단어·문법은 제공되지 않습니다. 선택적으로 `OPENAI_API_KEY`를 Actions secret으로 설정하면 RSS 설명을 외부 OpenAI API에 전달해 학습용 재작성·한국어 요약·단어·문법을 생성합니다. 별도 비용이 발생할 수 있고 AI가 틀릴 수 있으므로 원문과 대조하고 교사가 검토해야 합니다. 기본 모델은 `gpt-4o-mini`이며 저장소 변수 `OPENAI_MODEL`로 변경할 수 있습니다. 키가 설정된 상태에서 생성 실패 시 작업이 실패하며, 다음 실행에서 다시 시도합니다.

`npm run collect -- --dry-run`으로 데이터베이스에 쓰지 않고 피드 수집을 확인할 수 있으며 `npm test`로 수집 로직을 검사합니다.

## GitHub Pages 배포

`master`에 push하면 GitHub Actions가 Pages에 자동 배포합니다. Supabase를 연결하려면 저장소의 Actions secrets에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 설정하고 워크플로를 다시 실행하세요. 이 값은 브라우저에 공개되므로 서비스 역할 키가 아닌 anon key만 사용하고, SQL의 RLS 정책을 유지해야 합니다. Secrets가 없으면 예시 모드로 배포됩니다.
