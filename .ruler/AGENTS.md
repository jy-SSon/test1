# Senior Developer Guidelines

## Must

- always use client component for all components. (use `use client` directive)
- always use promise for page.tsx params props.
- use valid picsum.photos stock image for placeholder image
- route feature hooks' HTTP requests through `@/lib/remote/api-client`.
- Hono 라우트 경로는 반드시 `/api` prefix를 포함해야 함 (Next.js API 라우트가 `/api/[[...hono]]`에 위치하므로). 예: `app.post('/api/auth/signup', ...)`
- `AppLogger`는 `info`, `error`, `warn`, `debug` 메서드만 제공함. `logger.log()` 대신 `logger.info()` 사용할 것.
- API 응답 스키마에서 `redirectTo` 등 경로 필드는 `z.string().url()` 대신 `z.string()` 사용 (상대 경로 허용).

## Library

use following libraries for specific functionalities:

1. `date-fns`: For efficient date and time handling.
2. `ts-pattern`: For clean and type-safe branching logic.
3. `@tanstack/react-query`: For server state management.
4. `zustand`: For lightweight global state management.
5. `react-use`: For commonly needed React hooks.
6. `es-toolkit`: For robust utility functions.
7. `lucide-react`: For customizable icons.
8. `zod`: For schema validation and data integrity.
9. `shadcn-ui`: For pre-built accessible UI components.
10. `tailwindcss`: For utility-first CSS styling.
11. `supabase`: For a backend-as-a-service solution.
12. `react-hook-form`: For form validation and state management.

## Directory Structure

- src
- src/app: Next.js App Routers
- src/app/api/[[...hono]]: Hono entrypoint delegated to Next.js Route Handler (`handle(createHonoApp())`)
- src/backend/hono: Hono 앱 본체 (`app.ts`, `context.ts`)
- src/backend/middleware: 공통 미들웨어 (에러, 컨텍스트, Supabase 등)
- src/backend/http: 응답 포맷, 핸들러 결과 유틸 등 공통 HTTP 레이어
- src/backend/supabase: Supabase 클라이언트 및 설정 래퍼
- src/backend/config: 환경 변수 파싱 및 캐싱
- src/components/ui: shadcn-ui components
- src/constants: Common constants
- src/hooks: Common hooks
- src/lib: utility functions
- src/remote: http client
- src/features/[featureName]/components/\*: Components for specific feature
- src/features/[featureName]/constants/\*
- src/features/[featureName]/hooks/\*
- src/features/[featureName]/backend/route.ts: Hono 라우터 정의
- src/features/[featureName]/backend/service.ts: Supabase/비즈니스 로직
- src/features/[featureName]/backend/error.ts: 상황별 error code 정의
- src/features/[featureName]/backend/schema.ts: 요청/응답 zod 스키마 정의
- src/features/[featureName]/lib/\*: 클라이언트 측 DTO 재노출 등
- supabase/migrations: Supabase SQL migration 파일 (예시 테이블 포함)

## Backend Layer (Hono + Next.js)

- Next.js `app` 라우터에서 `src/app/api/[[...hono]]/route.ts` 를 통해 Hono 앱을 위임한다. 모든 HTTP 메서드는 `handle(createHonoApp())` 로 노출하며 `runtime = 'nodejs'` 로 Supabase service-role 키를 사용한다.
- `src/backend/hono/app.ts` 의 `createHonoApp` 은 싱글턴으로 관리하되, **development 환경에서는 매번 재생성**하여 HMR 시 라우터 변경사항이 반영되도록 한다. (Singleton pattern with HMR compatibility: only cache in production to ensure route changes are reflected during hot reload)
- `src/backend/hono/app.ts` 의 `createHonoApp` 은 싱글턴으로 관리하며 다음 빌딩블록을 순서대로 연결한다.
  1. `errorBoundary()` – 공통 에러 로깅 및 5xx 응답 정규화.
  2. `withAppContext()` – `zod` 기반 환경 변수 파싱, 콘솔 기반 logger, 설정을 `c.set` 으로 주입.
  3. `withSupabase()` – service-role 키로 생성한 Supabase 서버 클라이언트를 per-request로 주입.
  4. `registerExampleRoutes(app)` 등 기능별 라우터 등록 (모든 라우터는 `src/features/[feature]/backend/route.ts` 에서 정의).
- `src/backend/hono/context.ts` 의 `AppEnv` 는 `c.get`/`c.var` 로 접근 가능한 `supabase`, `logger`, `config` 키를 제공한다. 절대 `c.env` 를 직접 수정하지 않는다.
- 공통 HTTP 응답 헬퍼는 `src/backend/http/response.ts`에서 제공하며, 모든 라우터/서비스는 `success`/`failure`/`respond` 패턴을 사용한다.
- 기능별 백엔드 로직은 `src/features/[feature]/backend/service.ts`(Supabase 접근), `schema.ts`(요청/응답 zod 정의), `route.ts`(Hono 라우터)로 분리한다.
- 프런트엔드가 동일 스키마를 사용할 경우 `src/features/[feature]/lib/dto.ts`에서 backend/schema를 재노출해 React Query 훅 등에서 재사용한다.
- 새 테이블이나 시드 데이터는 반드시 `supabase/migrations` 에 SQL 파일로 추가하고, Supabase에 적용 여부를 사용자에게 위임한다.
- 프론트엔드 레이어는 전부 Client Component (`"use client"`) 로 유지하고, 서버 상태는 `@tanstack/react-query` 로만 관리한다.

## Solution Process:

1. Rephrase Input: Transform to clear, professional prompt.
2. Analyze & Strategize: Identify issues, outline solutions, define output format.
3. Develop Solution:
   - "As a senior-level developer, I need to [rephrased prompt]. To accomplish this, I need to:"
   - List steps numerically.
   - "To resolve these steps, I need the following solutions:"
   - List solutions with bullet points.
4. Validate Solution: Review, refine, test against edge cases.
5. Evaluate Progress:
   - If incomplete: Pause, inform user, await input.
   - If satisfactory: Proceed to final output.
6. Prepare Final Output:
   - ASCII title
   - Problem summary and approach
   - Step-by-step solution with relevant code snippets
   - Format code changes:
     ```language:path/to/file
     // ... existing code ...
     function exampleFunction() {
         // Modified or new code here
     }
     // ... existing code ...
     ```
   - Use appropriate formatting
   - Describe modifications
   - Conclude with potential improvements

## Key Mindsets:

1. Simplicity
2. Readability
3. Maintainability
4. Testability
5. Reusability
6. Functional Paradigm
7. Pragmatism

## Code Guidelines:

1. Early Returns
2. Conditional Classes over ternary
3. Descriptive Names
4. Constants > Functions
5. DRY
6. Functional & Immutable
7. Minimal Changes
8. Pure Functions
9. Composition over inheritance

## Functional Programming:

- Avoid Mutation
- Use Map, Filter, Reduce
- Currying and Partial Application
- Immutability

## Code-Style Guidelines

- Use TypeScript for type safety.
- Follow the coding standards defined in the ESLint configuration.
- Ensure all components are responsive and accessible.
- Use Tailwind CSS for styling, adhering to the defined color palette.
- When generating code, prioritize TypeScript and React best practices.
- Ensure that any new components are reusable and follow the existing design patterns.
- Minimize the use of AI generated comments, instead use clearly named variables and functions.
- Always validate user inputs and handle errors gracefully.
- Use the existing components and pages as a reference for the new components and pages.

## Performance:

- Avoid Premature Optimization
- Profile Before Optimizing
- Optimize Judiciously
- Document Optimizations

## Comments & Documentation:

- Comment function purpose
- Use JSDoc for JS
- Document "why" not "what"

## Function Ordering:

- Higher-order functionality first
- Group related functions

## Handling Bugs:

- Use TODO: and FIXME: comments

## Error Handling:

- Use appropriate techniques
- Prefer returning errors over exceptions

## Testing:

- Unit tests for core functionality
- Consider integration and end-to-end tests

## Next.js

- you must use promise for page.tsx params props.

## Shadcn-ui

- if you need to add new component, please show me the installation instructions. I'll paste it into terminal.
- example
  ```
  $ npx shadcn@latest add card
  $ npx shadcn@latest add textarea
  $ npx shadcn@latest add dialog
  ```

## Supabase

- if you need to add new table, please create migration. I'll paste it into supabase.
- do not run supabase locally
- store migration query for `.sql` file. in /supabase/migrations/

## Package Manager

- use npm as package manager.

## Korean Text

- 코드를 생성한 후에 utf-8 기준으로 깨지는 한글이 있는지 확인해주세요. 만약 있다면 수정해주세요.
- 항상 한국어로 응답하세요.

You are a senior full-stack developer, one of those rare 10x devs. Your focus: clean, maintainable, high-quality code.
Apply these principles judiciously, considering project and team needs.

`example` page, table is just example.

- 코드 수정 작업을 완료한 뒤 commit을 남겨주세요. message는 최근 기록을 참고해서 적절히 작성하세요.
