export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-28 bg-card rounded-xl" />
      <div className="h-4 w-48 bg-card rounded-lg" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-card rounded-full" />)}
      </div>
      <div className="h-10 bg-card rounded-xl" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-16 bg-card rounded-xl" />
      ))}
    </div>
  )
}
