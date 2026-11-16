# Daily Scoop

중학생을 위한 영어 기사 읽기와 요약·단어·문법 학습 앱입니다. Supabase 미설정 시 직접 작성한 예시 학습 지문이 표시됩니다.

## 실행

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트 URL과 anon key를 입력합니다.
3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
4. Supabase Authentication에서 교사 계정을 직접 생성합니다. 아래 AI 피드백을 활성화하려면 먼저 교사 권한 마이그레이션과 허용 목록을 설정해야 합니다.
5. `npm run dev`

Supabase 설정 후에는 데이터베이스에 등록된 기사만 표시됩니다. 교사 로그인 후 기사와 학습 자료를 등록할 수도 있습니다. 홈에는 분야별 최신 기사 1편씩, 총 5편이 표시됩니다. LEVEL 1~3은 학년 구분이 아닌 참고용 난이도입니다. 예시 모드의 다섯 지문은 링크된 보도를 참고해 새로 작성한 학습 자료이며 자동 갱신되지 않습니다. 학습 완료 및 작성한 요약은 현재 브라우저에 저장됩니다.

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

## 매일 자동 수집 (설정 불필요)

`Daily news & deploy` 워크플로가 한국 시간 매일 아침 7시경 TIME for Kids, NewsForKids.net, Science News Explores의 공개 RSS를 확인합니다. **환경·과학·생활·문화(스포츠 포함)·세상 5개 분야에서 한 편씩**, 오늘 날짜(`collection_day`)로 `public/data/articles.json`에 저장·커밋한 뒤 사이트를 다시 배포합니다. 별도 데이터베이스나 비밀값이 필요 없습니다.

- 최근 30일 이내 아직 싣지 않은 기사 중에서 분야별로 고르고, 부족하면 90일 이내의 아직 싣지 않은 기사로 5편을 채웁니다. 어떤 분야에 기사가 없으면 가장 적게 뽑힌 분야에서 채웁니다.
- 예약 실행이 빠지거나 늦을 때를 대비해 오전 9시 반, 오후 1시경에 보충 실행이 있습니다. 하루 5편을 넘게 싣지 않습니다.
- 90일이 지난 수집 기사는 파일에서 정리됩니다.
- GitHub 예약 작업은 늦게 시작될 수 있습니다. Actions 탭에서 `Daily news & deploy`를 수동 실행하면 바로 수집합니다.
- 기본 모드는 짧은 RSS 발췌문만 저장합니다. `OPENAI_API_KEY` Actions secret을 설정하면 학습용 재작성·번역·단어·문법을 AI로 생성합니다(비용 발생, 교사 검토 필요).
- 단순 키워드 차단은 모든 부적절한 내용을 걸러내지 못하므로 교사의 검토가 필요합니다. 외부 출처의 RSS 이용 조건을 확인하세요.

`npm run collect -- --dry-run`으로 저장 없이 수집 결과를 확인하고, `npm test`로 수집 로직을 검사합니다. Supabase를 쓰는 경우 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 설정하고 `npm run collect`로 DB에 저장할 수도 있습니다.

## 선생님 전용 화면 (비밀번호 로그인)

사이트 오른쪽 위 **선생님 전용** 버튼(또는 주소 끝 `#teacher`)으로 들어갑니다.

1. **처음 한 번(관리자)**: 저장소 주인 계정으로 fine-grained 토큰(이 저장소만, Contents: Read and write)을 만들고, 선생님 전용 화면의 설정 양식에 토큰과 선생님 비밀번호(8자 이상)를 입력합니다. 토큰은 비밀번호로 암호화(PBKDF2-SHA256 60만 회 + AES-GCM)되어 `public/data/teacher-auth.json`에 저장됩니다.
2. **이후 선생님들**: 비밀번호만 입력하면 기사를 올리고 삭제하고 비밀번호를 바꿀 수 있습니다. 올린 기사는 `public/data/teacher-articles.json`에 커밋되고 1~2분 뒤 사이트에 반영됩니다. 같은 날 같은 분야에서는 선생님 기사가 자동 수집 기사보다 먼저 실립니다.
3. **토큰 만료·비밀번호 분실**: 로그인 화면의 "로그인 다시 설정하기"에서 새 토큰과 비밀번호로 다시 설정합니다.

정적 사이트라 서버 측 로그인 시도 제한이 없습니다. 암호화된 파일은 공개되므로 추측하기 어려운 긴 비밀번호를 쓰고 선생님들에게만 알려 주세요. 토큰 권한은 이 저장소의 파일 쓰기로 한정해 피해 범위를 줄입니다.

## GitHub Pages 배포

`master`에 push하면 GitHub Actions가 Pages에 자동 배포합니다. Supabase를 연결하려면 저장소의 Actions secrets에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 설정하고 워크플로를 다시 실행하세요. 이 값은 브라우저에 공개되므로 서비스 역할 키가 아닌 anon key만 사용하고, SQL의 RLS 정책을 유지해야 합니다. Secrets가 없으면 예시 모드로 배포됩니다.
