export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[26px] bg-white text-ink-muted">
      <div className="mb-4 text-4xl">🚧</div>
      <div className="text-xl font-medium text-ink">{title}</div>
      <div className="mt-2 text-sm opacity-70">Coming soon</div>
    </div>
  )
}
