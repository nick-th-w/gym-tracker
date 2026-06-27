export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-48 bg-card rounded-xl" />
      <div className="h-4 w-32 bg-card rounded-lg" />
      <div className="h-20 bg-card rounded-2xl" />
      <div className="h-20 bg-card rounded-2xl" />
      <div className="h-28 bg-card rounded-2xl" />
    </div>
  )
}
