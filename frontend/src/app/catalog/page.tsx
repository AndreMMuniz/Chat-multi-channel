export default function CatalogPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <section className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              inventory_2
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Catalog</h1>
            <p className="text-sm text-slate-500">Products, services, and future catalog entities will be organized here.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            This placeholder establishes the catalog domain without mixing business data into unrelated areas.
          </p>
        </div>
      </section>
    </main>
  );
}
