import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"

export default function UsersLoading() {
  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="animate-pulse mb-8">
          <div className="bg-blue-300/20 h-8 w-48 rounded mb-2"></div>
          <div className="bg-blue-300/20 h-4 w-64 rounded"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-blue-300/20 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="animate-pulse mb-6">
          <div className="bg-blue-300/20 h-16 rounded-lg"></div>
        </div>

        {/* Table Skeleton */}
        <div className="animate-pulse">
          <div className="bg-blue-300/20 h-96 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}
