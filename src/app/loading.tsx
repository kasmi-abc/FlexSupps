export default function Loading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="loading">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-[420px] animate-pulse rounded-none bg-zinc-100 sm:h-[480px]" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
