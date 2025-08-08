"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShoppingBag, Users, Package, DollarSign, TrendingUp, Eye, Plus, Settings, BarChart3, Tag } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import type { Profile } from "@/lib/supabase"

interface DashboardStats {
  totalOrders: number
  totalUsers: number
  totalProducts: number
  totalRevenue: number
  recentOrders: any[]
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        checkAdminAccess(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const checkAdminAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error

      if (data.role !== "admin") {
        router.push("/")
        return
      }

      setProfile(data)
      await fetchDashboardStats()
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch orders count and revenue
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status, profiles(full_name)")
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      // Fetch users count
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id")

      if (usersError) throw usersError

      // Fetch products count
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")

      if (productsError) throw productsError

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const recentOrders = orders?.slice(0, 5) || []

      setStats({
        totalOrders: orders?.length || 0,
        totalUsers: users?.length || 0,
        totalProducts: products?.length || 0,
        totalRevenue,
        recentOrders
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast.error("Failed to load dashboard statistics")
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-600"
      case "packed":
        return "bg-blue-600"
      case "shipped":
        return "bg-purple-600"
      case "delivered":
        return "bg-green-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-blue-300/20 h-8 w-48 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-blue-300/20 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-200">Welcome back, {profile?.full_name}! Here's your store overview.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
              <p className="text-xs text-blue-300">All time orders</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-blue-300">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
              <p className="text-xs text-blue-300">Products in catalog</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-blue-300">All time revenue</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button asChild className="h-20 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/admin/products/add">
                <Plus className="w-6 h-6" />
                Add Product
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Link href="/admin/orders">
                <Eye className="w-6 h-6" />
                View Orders
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Link href="/admin/users">
                <Users className="w-6 h-6" />
                Manage Users
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2 bg-orange-600 hover:bg-orange-700 text-white">
              <Link href="/admin/categories">
                <Settings className="w-6 h-6" />
                Categories
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2 bg-pink-600 hover:bg-pink-700 text-white">
              <Link href="/admin/brands">
                <Tag className="w-6 h-6" />
                Brands
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-blue-800/20 rounded-lg">
                      <div>
                        <p className="font-semibold text-white">Order #{order.id}</p>
                        <p className="text-blue-300 text-sm">{order.profiles?.full_name || "Unknown Customer"}</p>
                        <p className="text-blue-400 text-xs">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-cyan-300">{formatCurrency(order.total_amount)}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs text-white ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full border-blue-400 text-blue-100 hover:bg-blue-800/50">
                      <Link href="/admin/orders">View All Orders</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                  <p className="text-blue-300">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
