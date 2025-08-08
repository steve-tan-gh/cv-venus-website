"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Package, Clock, Truck, CheckCircle, X, MapPin, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import type { Order } from "@/lib/supabase"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        if (params.id) {
          fetchOrder(params.id as string, user.id)
        }
      } else {
        router.push("/auth/signin")
      }
    })
  }, [params.id, router])

  const fetchOrder = async (orderId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url,
              slug
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq("id", orderId)
        .eq("user_id", userId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />
      case "packed":
        return <Package className="w-5 h-5" />
      case "shipped":
        return <Truck className="w-5 h-5" />
      case "delivered":
        return <CheckCircle className="w-5 h-5" />
      case "cancelled":
        return <X className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
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

  const getStatusSteps = () => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: Clock },
      { key: "packed", label: "Packed", icon: Package },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "delivered", label: "Delivered", icon: CheckCircle },
    ]

    const statusOrder = ["pending", "packed", "shipped", "delivered"]
    const currentIndex = statusOrder.indexOf(order?.status || "pending")

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }))
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
            <div className="bg-blue-300/20 h-8 w-32 rounded"></div>
            <div className="bg-blue-300/20 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button asChild>
            <Link href="/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button asChild variant="ghost" className="text-blue-200 hover:text-white p-0 mb-4">
            <Link href="/orders" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
              <p className="text-blue-200">Placed on {formatDate(order.created_at)}</p>
            </div>
            <Badge className={`${getStatusColor(order.status)} text-white text-lg px-4 py-2`}>
              {getStatusIcon(order.status)}
              <span className="ml-2 capitalize">{order.status}</span>
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Status & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            {order.status !== "cancelled" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white">Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      {statusSteps.map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                              step.completed
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                                : "bg-blue-800/50 text-blue-300"
                            }`}
                          >
                            <step.icon className="w-6 h-6" />
                          </div>
                          <p
                            className={`text-sm text-center ${
                              step.completed ? "text-white font-semibold" : "text-blue-300"
                            }`}
                          >
                            {step.label}
                          </p>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`hidden sm:block absolute h-0.5 w-full top-6 left-1/2 ${
                                step.completed ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-blue-800/50"
                              }`}
                              style={{ zIndex: -1 }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {order.tracking_number && (
                      <div className="mt-6 p-4 bg-blue-800/30 rounded-lg">
                        <p className="text-blue-200 text-sm">Tracking Number</p>
                        <p className="font-mono text-cyan-300 text-lg">{order.tracking_number}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Order Items ({order.order_items?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-blue-800/20 rounded-lg">
                        <div className="w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.products?.image_url || "/placeholder.svg?height=64&width=64"}
                            alt={item.products?.name || "Product"}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.products?.name}</h4>
                          <p className="text-blue-200 text-sm">
                            Quantity: {item.quantity} × Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-cyan-300">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </p>
                          {item.products?.slug && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-blue-300 hover:text-white p-0 mt-1"
                            >
                              <Link href={`/shop/${item.products.slug}`}>View Product</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary & Shipping */}
          <div className="space-y-6">
            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Subtotal</span>
                      <span className="font-semibold">
                        Rp{" "}
                        {(
                          order.order_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Shipping</span>
                      <span className="font-semibold">
                        Rp{" "}
                        {(
                          order.total_amount -
                          (order.order_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0)
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <Separator className="bg-blue-600/50" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-cyan-300">Rp {order.total_amount.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipping Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MapPin className="w-5 h-5 mr-2" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-200 text-sm">Customer</p>
                      <p className="text-white font-semibold">{order.profiles?.full_name}</p>
                      <p className="text-blue-300 text-sm">{order.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-200 text-sm">Phone</p>
                      <p className="text-white">{order.shipping_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-200 text-sm">Shipping Address</p>
                      <p className="text-white">{order.shipping_address}</p>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="mt-4 p-3 bg-blue-800/30 rounded-lg">
                      <p className="text-blue-200 text-sm mb-1">Order Notes</p>
                      <p className="text-white text-sm">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
