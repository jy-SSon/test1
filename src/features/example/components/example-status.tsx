'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExampleQuery } from '@/features/example/hooks/useExampleQuery';

const statusBadge = (
  label: string,
  tone: 'success' | 'error' | 'idle',
) => {
  const toneStyles: Record<typeof tone, string> = {
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/40',
    error: 'bg-rose-500/10 text-rose-300 border-rose-400/40',
    idle: 'bg-slate-500/10 text-slate-200 border-slate-400/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
};

export const ExampleStatus = () => {
  const [inputValue, setInputValue] = useState('');
  const [exampleId, setExampleId] = useState('');
  const query = useExampleQuery(exampleId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setExampleId('');
      return;
    }

    if (trimmed === exampleId) {
      void query.refetch();
      return;
    }

    setExampleId(trimmed);
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2 text-slate-100">
        <h1 className="text-3xl font-semibold tracking-tight">Backend Health Check</h1>
        <p className="text-sm text-slate-300">
          예시 API(`/api/example/:id`)가 정상 동작하는지 확인합니다. Supabase 예시
          레코드의 UUID를 입력하면 React Query를 통해 백엔드 응답을 확인할 수
          있습니다.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center"
      >
        <div className="flex-1 space-y-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Example UUID
          </label>
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="bg-slate-900/70 text-slate-100 placeholder:text-slate-600"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="mt-2 h-12 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 md:mt-6"
        >
          조회하기
        </Button>
      </form>

      <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">현재 상태</h2>
          {exampleId
            ? query.status === 'pending'
              ? statusBadge('Fetching', 'idle')
              : query.status === 'error'
                ? statusBadge('Error', 'error')
                : statusBadge('Success', 'success')
            : statusBadge('Idle', 'idle')}
        </div>

        {!exampleId && (
          <p className="text-sm text-slate-300">
            UUID를 입력하고 조회하기 버튼을 누르면 결과가 이곳에 표시됩니다.
          </p>
        )}

        {exampleId && query.status === 'pending' && (
          <p className="text-sm text-slate-300">Supabase에서 데이터를 가져오는 중...</p>
        )}

        {query.status === 'error' && (
          <div className="space-y-2 rounded-lg border border-rose-400/30 bg-rose-500/5 p-4">
            <p className="text-sm font-medium text-rose-300">요청 실패</p>
            <p className="text-xs text-rose-200/80">
              {query.error instanceof Error
                ? query.error.message
                : '알 수 없는 에러가 발생했습니다.'}
            </p>
          </div>
        )}

        {query.data && (
          <div className="space-y-3 rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-4 text-sm text-emerald-100">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">ID</p>
              <p className="font-mono text-xs md:text-sm">{query.data.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">
                이름
              </p>
              <p>{query.data.fullName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">
                소개
              </p>
              <p>{query.data.bio ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">
                아바타
              </p>
              <a
                href={query.data.avatarUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {query.data.avatarUrl}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">
                업데이트 시각
              </p>
              <p>{query.data.updatedAt}</p>
            </div>
          </div>
        )}
      </article>
    </section>
  );
};
