import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"

export default function DiscountsLoading() {
  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="bg-blue-300/20 h-8 w-48 rounded mb-2"></div>
          <div className="bg-blue-300/20 h-4 w-64 rounded"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm border border-blue-400/20 rounded-lg p-6 animate-pulse"
            >
              <div className="bg-blue-300/20 h-4 w-20 rounded mb-2"></div>
              <div className="bg-blue-300/20 h-8 w-16 rounded mb-1"></div>
              <div className="bg-blue-300/20 h-3 w-24 rounded"></div>
            </div>
          ))}
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 animate-pulse">
          <div className="bg-blue-300/20 h-10 w-64 rounded"></div>
          <div className="bg-blue-300/20 h-10 w-32 rounded"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/10 backdrop-blur-sm border border-blue-400/20 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-blue-400/20 animate-pulse">
            <div className="bg-blue-300/20 h-6 w-32 rounded"></div>
          </div>

          <div className="divide-y divide-blue-400/20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="bg-blue-300/20 h-5 w-48 rounded"></div>
                    <div className="bg-blue-300/20 h-4 w-32 rounded"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-300/20 h-6 w-16 rounded"></div>
                    <div className="bg-blue-300/20 h-8 w-20 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
