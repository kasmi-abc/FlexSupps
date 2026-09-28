export default function ProductsLoading() {
  return (
    <div aria-busy="true" aria-label="loading">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-zinc-100" />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg border border-zinc-100 bg-zinc-50" />
        ))}
      </div>
    </div>
  )
}
