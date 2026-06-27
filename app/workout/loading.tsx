export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-48 bg-card rounded-xl" />
      <div className="h-4 w-36 bg-card rounded-lg" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-24 bg-card rounded-2xl" />
      ))}
    </div>
  )
}
