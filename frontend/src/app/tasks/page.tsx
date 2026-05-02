export default function TasksPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <section className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              task
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
            <p className="text-sm text-slate-500">Operational follow-up work will be tracked here.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            This placeholder keeps tasks as a first-class product area instead of hiding them inside conversations.
          </p>
        </div>
      </section>
    </main>
  );
}
