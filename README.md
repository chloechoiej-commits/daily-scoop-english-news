# Daily Scoop

중학생을 위한 영어 기사 읽기와 요약·단어·문법 학습 앱입니다. Supabase 미설정 시 직접 작성한 예시 학습 지문이 표시됩니다.

## 실행

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트 URL과 anon key를 입력합니다.
3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
4. Supabase Authentication에서 교사 계정을 직접 생성합니다. 아래 AI 피드백을 활성화하려면 먼저 교사 권한 마이그레이션과 허용 목록을 설정해야 합니다.
5. `npm run dev`

Supabase 설정 후에는 데이터베이스에 등록된 기사만 표시됩니다. 교사 로그인 후 기사와 학습 자료를 등록할 수도 있습니다. 홈에는 최근 기사 최대 5개가 표시됩니다. LEVEL 1~3은 학년 구분이 아닌 참고용 난이도입니다. 예시 모드의 다섯 지문은 링크된 보도를 참고해 새로 작성한 학습 자료이며 자동 갱신되지 않습니다. 학습 완료 및 작성한 요약은 현재 브라우저에 저장됩니다.

기사 제목은 영어로만 표시되며 한국어 본문은 학습 후 번역 탭에서 볼 수 있습니다. 교사가 기사 등록 시 전체 본문 번역을 입력할 수 있습니다. 기존 Supabase 프로젝트는 `supabase/migrations/2026111201_article_translation.sql`을 실행하세요. 기존 기사에는 번역이 자동으로 채워지지 않으므로 별도 등록이 필요합니다. 기본 RSS 발췌 모드도 번역을 생성하지 않습니다. AI 학습 자료 생성 설정 시 새 지문의 한국어 번역을 함께 생성하며 오류가 있을 수 있어 검토가 필요합니다.

## AI 요약 피드백 설정

요약과 기사 내용을 Supabase Edge Function을 통해 OpenAI로 보내 어휘·문법·의미를 분석합니다. API 비용이 발생할 수 있고, 결과가 틀릴 수 있으므로 교사가 확인해야 합니다. 학습자는 전송 전 동의해야 하며 개인정보를 요약에 적지 않도록 안내하세요. 운영자는 학교의 미성년자 개인정보 처리 및 외부 서비스 이용 권한을 확인해야 합니다. 요약은 이 앱의 서버나 DB에 저장하지 않지만 OpenAI의 데이터 처리·보존 정책은 별도로 적용됩니다. 제한을 위해 사용자 ID와 시각만 DB에 저장하며, 요청이 들어올 때 2일이 지난 기록을 삭제합니다.

설정하지 않으면 기존 단순 규칙 결과를 진짜 AI 피드백처럼 보여주지 않고 설정이 필요하다는 안내를 표시합니다. 데모 모드에서는 AI 피드백을 사용할 수 없습니다.

1. 기존 프로젝트는 `supabase/migrations/20261112_summary_feedback.sql`을 실행합니다. 신규 프로젝트도 `supabase/schema.sql` 다음에 이 마이그레이션을 실행하세요. **익명 로그인이나 공개 회원가입을 켜기 전에** 모든 기존 RLS 정책을 확인하고 이 마이그레이션을 적용해야 합니다. 다른 permissive INSERT 정책이 남아 있으면 권한 제한이 우회될 수 있습니다.
2. 교사 계정별로 SQL Editor에서 허용 목록에 등록합니다. 이 목록에 없는 계정은 기사를 등록할 수 없습니다. 이메일을 실제 교사 계정으로 교체하세요.

   ```sql
   insert into private.teacher_users (user_id)
   select id from auth.users where email = 'teacher@example.com' and is_anonymous = false
   on conflict (user_id) do nothing;
   ```

3. Supabase Auth에서 익명 로그인을 활성화하고 새 사용자 가입도 허용합니다. 가입을 허용하면 이메일 등 다른 활성 제공자를 통한 가입도 가능하므로 다른 테이블의 RLS도 반드시 검토하세요. 익명 사용자는 `authenticated` 역할이지만 위 허용 목록 없이는 기사를 추가할 수 없습니다. 익명 계정 생성 남용을 막기 위해 Auth rate limit을 설정하고 CAPTCHA도 검토하세요. 현재 앱에는 CAPTCHA 토큰 입력 UI가 없으므로 CAPTCHA를 켜기 전 별도 연동이 필요합니다.
4. Supabase Edge Functions의 비밀값에 `OPENAI_API_KEY`를 설정하고 `supabase link --project-ref <프로젝트 ID>` 후 `supabase functions deploy summary-feedback`으로 배포합니다. 기본 모델은 `gpt-4o-mini`, 선택적 Edge Function secret `SUMMARY_FEEDBACK_MODEL`로 변경할 수 있습니다. 서비스 역할 키와 OpenAI 키는 클라이언트 코드나 GitHub Pages에 넣지 마세요. 게이트웨이 JWT 검사는 꺼져 있지만 함수가 모든 요청의 토큰을 Supabase Auth로 검증합니다.
5. 프런트엔드의 Supabase URL과 anon key를 설정하고 Pages를 다시 배포하세요. Supabase에 실제 기사가 등록되어 있어야 합니다. 학생당 1시간 10회, 전체 24시간 250회의 서버 측 제한이 있으며 실패한 AI 호출도 한도에 포함됩니다. 추가로 OpenAI 예산 한도와 알림을 설정하세요.

## 매일 자동 수집

GitHub Actions가 한국 시간 매일 오전 8시경 TIME for Kids와 NewsForKids.net의 공개 RSS를 확인합니다. 최근 14일 이내 미등록 기사를 하루 최대 5건 가져오며, 수집된 기사 수가 적거나 피드에 새 기사가 없으면 5건보다 적을 수 있습니다. 발행일과 출처 링크를 보존하고 제목과 URL을 기준으로 중복을 줄입니다. GitHub 예약 작업은 지연될 수 있습니다. 단순 키워드 차단은 모든 부적절한 내용을 걸러내지 못하므로 교사의 검토가 필요합니다.

1. 기존 데이터베이스는 `supabase/migrations/20261111_daily_collection.sql`을 실행합니다. 새 데이터베이스는 `supabase/schema.sql`을 실행합니다.
2. GitHub Actions secrets에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 설정합니다. 서비스 역할 키는 서버 전용이며 절대 `VITE_` 변수나 소스 코드에 넣지 마세요. 프런트엔드는 별도로 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 필요합니다.
3. `Collect daily news` 워크플로를 수동 실행해 확인한 뒤 예약 실행을 사용합니다. 외부 출처의 RSS 이용 조건과 발췌·재작성에 대한 권리를 검토하세요.

기본 모드에서는 짧은 RSS 발췌문만 저장하고 전체 기사는 원문 링크로 읽습니다. 난이도는 단순 자동 추정이며 한국어 요약·단어·문법은 제공되지 않습니다. 선택적으로 `OPENAI_API_KEY`를 Actions secret으로 설정하면 RSS 설명을 외부 OpenAI API에 전달해 학습용 재작성·한국어 요약·단어·문법을 생성합니다. 별도 비용이 발생할 수 있고 AI가 틀릴 수 있으므로 원문과 대조하고 교사가 검토해야 합니다. 기본 모델은 `gpt-4o-mini`이며 저장소 변수 `OPENAI_MODEL`로 변경할 수 있습니다. 키가 설정된 상태에서 생성 실패 시 작업이 실패하며, 다음 실행에서 다시 시도합니다.

`npm run collect -- --dry-run`으로 데이터베이스에 쓰지 않고 피드 수집을 확인할 수 있으며 `npm test`로 수집 로직을 검사합니다.

## GitHub Pages 배포

`master`에 push하면 GitHub Actions가 Pages에 자동 배포합니다. Supabase를 연결하려면 저장소의 Actions secrets에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 설정하고 워크플로를 다시 실행하세요. 이 값은 브라우저에 공개되므로 서비스 역할 키가 아닌 anon key만 사용하고, SQL의 RLS 정책을 유지해야 합니다. Secrets가 없으면 예시 모드로 배포됩니다.
