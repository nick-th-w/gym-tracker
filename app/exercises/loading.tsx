export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-28 bg-card rounded-xl" />
      <div className="h-4 w-20 bg-card rounded-lg" />
      <div className="h-12 bg-card rounded-xl" />
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="h-8 w-20 bg-card rounded-full" />)}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-16 bg-card rounded-full" />)}
      </div>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="h-20 bg-card rounded-xl" />
      ))}
    </div>
  )
}
