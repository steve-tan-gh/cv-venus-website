"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, MapPin, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { getCartItems, clearCart } from "@/lib/cart"
import { toast } from "sonner"
import type { CartItem } from "@/lib/supabase"

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    notes: "",
  })

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchUserData(user.id)
        fetchCartItems(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchUserData = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (data) {
        setProfile(data)
        setFormData({
          fullName: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchCartItems = async (userId: string) => {
    try {
      const items = await getCartItems(userId)
      if (items.length === 0) {
        router.push("/cart")
        return
      }
      setCartItems(items)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      toast.error("Failed to load cart items")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || cartItems.length === 0) return

    // Validate form
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)

    try {
      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0)
      const shipping = totalAmount > 100000 ? 0 : 10000
      const finalTotal = totalAmount + shipping

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: finalTotal,
          status: "pending",
          shipping_address: formData.address,
          shipping_phone: formData.phone,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products?.price || 0,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Update user profile if needed
      if (
        formData.fullName !== profile?.full_name ||
        formData.phone !== profile?.phone ||
        formData.address !== profile?.address
      ) {
        await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
      }

      // Clear cart
      await clearCart(user.id)

      toast.success("Order placed successfully!")
      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0)
  const shipping = subtotal > 100000 ? 0 : 10000
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-blue-300/20 h-8 w-32 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-blue-300/20 h-96 rounded-lg"></div>
              <div className="bg-blue-300/20 h-96 rounded-lg"></div>
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
          <Button onClick={() => router.back()} variant="ghost" className="text-blue-200 hover:text-white p-0 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>
          <p className="text-blue-200">Complete your order</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shipping Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MapPin className="w-5 h-5 mr-2" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-blue-200">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-blue-200">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-blue-200">
                      Shipping Address *
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Enter your complete shipping address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-blue-200">
                      Order Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Any special instructions for your order"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-white">{item.products?.name}</p>
                          <p className="text-sm text-blue-200">
                            Qty: {item.quantity} × Rp {item.products?.price?.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className="font-semibold text-cyan-300">
                          Rp {((item.products?.price || 0) * item.quantity).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-blue-600/50" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Subtotal</span>
                      <span className="font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-blue-200">Shipping</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <span className="text-green-400">Free</span>
                        ) : (
                          `Rp ${shipping.toLocaleString("id-ID")}`
                        )}
                      </span>
                    </div>

                    {shipping > 0 && <p className="text-xs text-blue-300">Free shipping on orders over Rp 100,000</p>}

                    <Separator className="bg-blue-600/50" />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-cyan-300">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-800/30 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold mb-2 text-white">Payment Method</h4>
                    <p className="text-blue-200 text-sm">Cash on Delivery (COD) - Pay when your order arrives</p>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    size="lg"
                  >
                    {submitting ? (
                      "Placing Order..."
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  )
}
