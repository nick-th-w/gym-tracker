export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-40 bg-card rounded-xl" />
      <div className="h-4 w-32 bg-card rounded-lg" />
      <div className="h-24 bg-card rounded-2xl" />
      <div className="h-12 bg-card rounded-xl" />
      <div className="h-64 bg-card rounded-2xl" />
    </div>
  )
}
