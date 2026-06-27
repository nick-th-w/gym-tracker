export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-24 bg-card rounded-xl" />
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="h-8 w-20 bg-card rounded-full" />)}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-16 bg-card rounded-full" />)}
      </div>
      <div className="h-40 bg-card rounded-2xl" />
      {[1,2,3,4].map(i => (
        <div key={i} className="flex gap-3">
          <div className="w-[72px] h-20 bg-card rounded-2xl shrink-0" />
          <div className="flex-1 h-20 bg-card rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
