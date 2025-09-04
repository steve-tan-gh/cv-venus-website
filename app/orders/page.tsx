"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Package, Eye, Calendar, MapPin, Phone, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Order } from "@/lib/supabase"

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchOrders(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url
            )
          ),
          applied_discounts (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "packed":
        return "bg-blue-500"
      case "shipped":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
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

  if (orders.length === 0) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <Package className="w-24 h-24 mx-auto mb-6 text-blue-400" />
            <h1 className="text-3xl font-bold mb-4">No orders yet</h1>
            <p className="text-blue-200 mb-8">Start shopping to see your orders here!</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-blue-200">Track and manage your orders</p>
        </motion.div>

        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">Order #{order.id}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-200 text-sm">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold">Items ({order.order_items?.length || 0})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.order_items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-blue-800/20 rounded">
                          <div className="w-12 h-12 bg-blue-700/30 rounded overflow-hidden">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url || "/placeholder.svg"}
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.products?.name}</p>
                            <p className="text-blue-200 text-xs">
                              {item.quantity} × {formatPrice(item.price)}
                              {item.free_quantity && item.free_quantity > 0 && (
                                <span className="text-green-400 ml-1">+ {item.free_quantity} free</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(order.order_items?.length || 0) > 3 && (
                        <div className="flex items-center justify-center p-2 bg-blue-800/20 rounded">
                          <span className="text-blue-200 text-sm">
                            +{(order.order_items?.length || 0) - 3} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applied Discounts */}
                  {order.applied_discounts && order.applied_discounts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Applied Discounts
                      </h4>
                      <div className="space-y-1">
                        {order.applied_discounts.map((discount) => (
                          <div key={discount.id} className="bg-green-900/20 p-2 rounded text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-green-300 font-medium">{discount.discount_name}</span>
                              <span className="text-green-200">
                                {discount.discount_amount && discount.discount_amount > 0
                                  ? `-${formatPrice(discount.discount_amount)}`
                                  : ""}
                                {discount.free_quantity && discount.free_quantity > 0
                                  ? ` +${discount.free_quantity} free`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-600/30">
                    <div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-200 text-sm">Shipping Address</p>
                          <p className="text-white text-sm">{order.shipping_address}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-blue-200 text-sm">Phone</p>
                          <p className="text-white text-sm">{order.shipping_phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-600/30">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Subtotal:</span>
                        <span className="text-blue-200">{formatPrice(order.total_amount)}</span>
                      </div>
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Discount:</span>
                          <span className="text-green-400">-{formatPrice(order.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">Total:</span>
                        <span className="text-white">{formatPrice(order.final_amount)}</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="border-blue-400 text-blue-100 hover:bg-blue-700/50 bg-transparent"
                    >
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
