'use client';

import { ExampleStatus } from '@/features/example/components/example-status';

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-100">
      <ExampleStatus />
    </div>
  );
}
