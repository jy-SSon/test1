"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle2, Boxes, Database, LogOut, Server } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type SetupCommand = {
  id: string;
  label: string;
  command: string;
};

const setupCommands: SetupCommand[] = [
  { id: "install", label: "의존성 설치", command: "npm install" },
  { id: "lint", label: "정적 점검", command: "npm run lint" },
  { id: "dev", label: "로컬 개발 서버", command: "npm run dev" },
];

const envVariables = [
  {
    key: "SUPABASE_URL",
    description: "Supabase 프로젝트 URL (https://...supabase.co)",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    description:
      "서버 전용 service-role 키. 절대 클라이언트로 노출하지 마세요.",
  },
];

const directorySummary = [
  {
    title: "앱 라우터",
    description: "Next.js App Router 엔트리포인트와 레이아웃 정의",
    path: "src/app",
  },
  {
    title: "Hono 엔트리포인트",
    description: "Next.js Route Handler에서 Hono 앱을 위임",
    path: "src/app/api/[[...hono]]",
  },
  {
    title: "백엔드 구성요소",
    description: "Hono 앱, 미들웨어, Supabase 서비스",
    path: "src/backend",
  },
  {
    title: "기능 모듈",
    description: "각 기능별 DTO, 라우터, React Query 훅",
    path: "src/features/[feature]",
  },
];

const backendBuildingBlocks = [
  {
    icon: <Server className="w-4 h-4" />,
    title: "Hono 앱 구성",
    description:
      "errorBoundary → withAppContext → withSupabase → registerExampleRoutes 순서로 미들웨어와 라우터를 조립합니다.",
  },
  {
    icon: <Database className="w-4 h-4" />,
    title: "Supabase 서비스",
    description:
      "service-role 키로 생성한 서버 클라이언트를 사용하고, 쿼리 결과는 ts-pattern으로 분기 가능한 결과 객체로 반환합니다.",
  },
  {
    icon: <Boxes className="w-4 h-4" />,
    title: "React Query 연동",
    description:
      "모든 클라이언트 데이터 패칭은 useExampleQuery와 같은 React Query 훅을 통해 수행하며, DTO 스키마로 응답을 검증합니다.",
  },
];

export default function Home() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const authActions = useMemo(() => {
    if (isLoading) {
      return (
        <span className="text-sm text-slate-300">세션 확인 중...</span>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <span className="truncate">{user.email ?? "알 수 없는 사용자"}</span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-600 px-3 py-1 transition hover:border-slate-400 hover:bg-slate-800"
            >
              대시보드
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
        >
          회원가입
        </Link>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    window.setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-4">
          <div className="text-sm font-medium text-slate-300">
            SuperNext — 구조적인 Next.js + Supabase 템플릿
          </div>
          {authActions}
        </div>
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            SuperNext 프로젝트 설정 & 구조 안내서
          </h1>
          <p className="max-w-3xl text-base text-slate-300 md:text-lg">
            React Query / Hono.js / Supabase를 사용합니다.
            <br /> 모든 컴포넌트는 Client Component로 작성합니다.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          <SetupChecklist copiedCommand={copiedCommand} onCopy={handleCopy} />
          <EnvironmentGuide />
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <DirectoryOverview />
          <BackendOverview />
        </section>

        <footer className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100">
            Supabase Migration
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            `supabase/migrations/20250227000100_create_example_table.sql` 파일을
            Supabase 대시보드 SQL Editor에 업로드하여 `public.example` 테이블과
            샘플 데이터를 생성하세요. 서비스 역할 키는 서버 환경 변수에만
            저장하고, React Query 훅에서는 공개 API만 호출합니다.
          </p>
        </footer>
      </div>
    </main>
  );
}

function SetupChecklist({
  copiedCommand,
  onCopy,
}: {
  copiedCommand: string | null;
  onCopy: (command: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">
        SuperNext 설치 체크리스트
      </h2>
      <ul className="space-y-3">
        {setupCommands.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-slate-100">{item.label}</p>
                <code className="text-sm text-slate-300">{item.command}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCopy(item.command)}
              className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedCommand === item.command ? "복사됨" : "복사"}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        개발 서버는 React Query Provider가 설정된 `src/app/providers.tsx`를
        통과하여 실행됩니다.
      </p>
    </div>
  );
}

function EnvironmentGuide() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">환경 변수</h2>
      <p className="text-sm text-slate-300">
        `.env.local` 파일에 아래 값을 추가하고, service-role 키는 서버 빌드
        환경에서만 주입하세요.
      </p>
      <ul className="space-y-3">
        {envVariables.map((item) => (
          <li
            key={item.key}
            className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
          >
            <p className="font-medium text-slate-100">{item.key}</p>
            <p className="text-xs text-slate-300">{item.description}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        환경 스키마는 `src/backend/config/index.ts`에서 zod로 검증되며, 누락 시
        명확한 오류를 발생시킵니다.
      </p>
    </div>
  );
}

function DirectoryOverview() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">
        SuperNext 주요 디렉터리
      </h2>
      <ul className="space-y-3">
        {directorySummary.map((item) => (
          <li
            key={item.path}
            className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
          >
            <p className="text-sm font-semibold text-slate-100">{item.path}</p>
            <p className="text-xs text-slate-300">{item.description}</p>
            <p className="text-xs text-slate-400">{item.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackendOverview() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">
        SuperNext 백엔드 빌딩 블록
      </h2>
      <ul className="space-y-3">
        {backendBuildingBlocks.map((item, index) => (
          <li
            key={item.title + index}
            className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
          >
            <div className="mt-0.5 text-indigo-300">{item.icon}</div>
            <div>
              <p className="font-medium text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-300">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        예시 라우터는 `src/features/example/backend/route.ts`, 서비스 로직은
        `src/features/example/backend/service.ts`, 공통 스키마는
        `src/features/example/backend/schema.ts`에서 관리하며 Supabase
        `public.example` 테이블과 통신합니다.
      </p>
    </div>
  );
}
