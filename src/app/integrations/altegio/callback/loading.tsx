export default function AltegioCallbackLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section aria-live="polite" className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="size-9 animate-pulse rounded-xl bg-indigo-200" />
        <h1 className="mt-8 text-3xl font-semibold text-slate-950">Активация Altegio выполняется</h1>
        <p className="mt-4 text-slate-600">Проверяем выбранные филиалы. Не закрывайте страницу.</p>
      </section>
    </main>
  );
}
