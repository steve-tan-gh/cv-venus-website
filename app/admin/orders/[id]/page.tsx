"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Package, User, Calendar, CreditCard, MapPin, Phone, Mail, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import type { Order, Profile } from "@/lib/supabase"

interface OrderItem {
  id: number
  quantity: number
  price: number
  products: {
    id: number
    name: string
    image_url: string
    slug: string
  }
}

interface OrderDetails extends Order {
  profiles: Profile
  order_items: OrderItem[]
}

// import AdminOrderDetailsPage from "./AdminOrderDetailsPage"

// export default async function Page({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params // ✅ unwrap di server
//   return <AdminOrderDetailsPage orderId={id} />
// }


export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [order, setOrder] = useState<OrderDetails | null>(null)
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
      fetchOrderDetails()
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            phone,
            address,
            role
          ),
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              image_url,
              slug
            )
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      if (!data) {
        toast.error("Order not found")
        router.push("/admin/orders")
        return
      }

      setOrder(data as OrderDetails)
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast.error("Failed to load order details")
      router.push("/admin/orders")
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id)

      if (error) throw error

      setOrder({ ...order, status: newStatus as any })
      toast.success("Order status updated successfully!")
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Failed to update order status")
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-blue-300/20 h-8 w-48 rounded"></div>
            <div className="bg-blue-300/20 h-96 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm" className="text-blue-200 hover:text-white">
              <Link href="/admin/orders">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
              <p className="text-blue-200">Order details and management</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`${getStatusColor(order.status)} text-white border-0 px-4 py-2`}>
                {order.status.toUpperCase()}
              </Badge>
              <Button asChild variant="outline" className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                <Link href={`/admin/orders/${order.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({order.order_items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-blue-800/20 rounded-lg">
                        <div className="w-16 h-16 bg-blue-700/50 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.products.image_url ? (
                            <img
                              src={item.products.image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{item.products.name}</h3>
                          <p className="text-blue-300 text-sm">Product ID: {item.products.id}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-blue-200">Qty: {item.quantity}</span>
                            <span className="text-blue-200">Price: {formatCurrency(item.price)}</span>
                            <span className="font-semibold text-cyan-300">
                              Total: {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/shop/${item.products.slug}`}>
                            View Product
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                      <p className="text-blue-300">No items found in this order</p>
                    </div>
                  )}
                </div>

                <Separator className="my-6 bg-blue-600/50" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-blue-200">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <Separator className="bg-blue-600/50" />
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Info & Customer Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Order Information */}
            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Order Date</p>
                  <p className="text-white font-semibold">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Last Updated</p>
                  <p className="text-white font-semibold">{formatDate(order.updated_at)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Payment Method</p>
                  <p className="text-white font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {order.payment_method || "Not specified"}
                  </p>
                </div>
                {order.tracking_number && (
                  <div>
                    <p className="text-blue-200 text-sm">Tracking Number</p>
                    <p className="text-white font-semibold">{order.tracking_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-blue-200 text-sm">Status</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["pending", "packed", "shipped", "delivered", "cancelled"].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={order.status === status ? "default" : "outline"}
                        onClick={() => updateOrderStatus(status)}
                        className={
                          order.status === status
                            ? `${getStatusColor(status)} text-white border-0`
                            : "border-blue-400 text-blue-100 hover:bg-blue-800/50"
                        }
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Full Name</p>
                  <p className="text-white font-semibold">{order.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="text-white font-semibold">{order.profiles.email}</p>
                </div>
                {order.profiles.phone && (
                  <div>
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </p>
                    <p className="text-white font-semibold">{order.profiles.phone}</p>
                  </div>
                )}
                {order.profiles.address && (
                  <div>
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </p>
                    <div className="text-white">
                      <p>{order.profiles.address}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-blue-200 text-sm">Customer Type</p>
                  <Badge variant="outline" className="border-blue-400 text-blue-100">
                    {order.profiles.role || "customer"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
