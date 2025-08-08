"use client"

import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BrandsLoading() {
  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="bg-blue-300/20 h-8 w-64 rounded mb-2"></div>
              <div className="bg-blue-300/20 h-4 w-48 rounded"></div>
            </div>
            <div className="bg-blue-300/20 h-10 w-32 rounded"></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="bg-blue-300/20 h-4 w-24 rounded"></div>
                      <div className="bg-blue-300/20 h-8 w-16 rounded"></div>
                    </div>
                    <div className="bg-blue-300/20 h-8 w-8 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="bg-blue-300/20 h-10 w-full rounded"></div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <div className="bg-blue-300/20 h-6 w-32 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-blue-800/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-300/20 h-12 w-12 rounded"></div>
                      <div className="space-y-2">
                        <div className="bg-blue-300/20 h-4 w-32 rounded"></div>
                        <div className="bg-blue-300/20 h-3 w-48 rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-blue-300/20 h-8 w-8 rounded"></div>
                      <div className="bg-blue-300/20 h-8 w-8 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
