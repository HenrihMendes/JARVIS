export function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-12" aria-busy="true" aria-label="Carregando">
      <div className="skeleton h-3 w-32" />
      <div className="skeleton mt-10 h-20 w-2/3 max-w-xl" />
      <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[2/3]" />
            <div className="skeleton mt-4 h-4 w-3/4" />
            <div className="skeleton mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
