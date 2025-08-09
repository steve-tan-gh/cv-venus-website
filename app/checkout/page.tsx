"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, MapPin, Gift, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { calculateCartWithDiscounts, clearCart } from "@/lib/cart"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { CartWithDiscounts, Profile } from "@/lib/supabase"
import Link from "next/link"

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cartData, setCartData] = useState<CartWithDiscounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    notes: "",
  })
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchUserData(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setFormData({
        fullName: profileData.full_name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        notes: "",
      })

      // Fetch cart data
      const cartData = await calculateCartWithDiscounts(userId)
      setCartData(cartData)

      // Redirect if cart is empty
      if (!cartData || cartData.items.length === 0) {
        router.push("/cart")
        return
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("Failed to load checkout data")
      router.push("/cart")
    } finally {
      setLoading(false)
    }
  }

  const validateStock = async (): Promise<boolean> => {
    if (!cartData) return false

    for (const item of cartData.items) {
      const { data: product, error } = await supabase
        .from("products")
        .select("stock, is_active")
        .eq("id", item.product_id)
        .single()

      if (error) {
        toast.error("Failed to validate stock")
        return false
      }

      if (!product.is_active) {
        toast.error(`${item.products?.name} is no longer available`)
        return false
      }

      if (product.stock < item.quantity) {
        toast.error(`Not enough stock for ${item.products?.name}. Only ${product.stock} available.`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !cartData || processing) return

    // Validate form
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields")
      return
    }

    setProcessing(true)

    try {
      // Validate stock before processing
      const stockValid = await validateStock()
      if (!stockValid) {
        setProcessing(false)
        return
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: cartData.subtotal,
          discount_amount: cartData.totalDiscount,
          final_amount: cartData.finalTotal,
          status: "pending",
          shipping_address: formData.address,
          shipping_phone: formData.phone,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items and update stock
      for (const item of cartData.items) {
        // Calculate free quantity for this item
        let freeQuantityForItem = 0
        for (const applied of cartData.appliedDiscounts) {
          if (applied.freeQuantity > 0 && applied.affectedItems.some((ai) => ai.id === item.id)) {
            // Distribute free quantity proportionally
            const totalAffectedQuantity = applied.affectedItems.reduce((sum, ai) => sum + ai.quantity, 0)
            const itemProportion = item.quantity / totalAffectedQuantity
            freeQuantityForItem += Math.floor(applied.freeQuantity * itemProportion)
          }
        }

        // Insert order item
        const { error: itemError } = await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          free_quantity: freeQuantityForItem,
          price: item.products?.price || 0,
        })

        if (itemError) throw itemError

        // Get current stock and update it
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single()

        if (fetchError) throw fetchError

        const newStock = currentProduct.stock - (item.quantity + freeQuantityForItem)

        // Update product stock
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.product_id)

        if (stockError) throw stockError
      }

      // Record applied discounts
      for (const applied of cartData.appliedDiscounts) {
        const { error: discountError } = await supabase.from("applied_discounts").insert({
          order_id: order.id,
          discount_id: applied.discount.id,
          discount_name: applied.discount.name,
          discount_type: applied.discount.type,
          original_quantity: applied.affectedItems.reduce((sum, item) => sum + item.quantity, 0),
          free_quantity: applied.freeQuantity,
          discount_amount: applied.discountAmount,
        })

        if (discountError) throw discountError
      }

      // Update user profile if needed
      if (
        formData.fullName !== profile?.full_name ||
        formData.phone !== profile?.phone ||
        formData.address !== profile?.address
      ) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (profileError) console.error("Error updating profile:", profileError)
      }

      // Clear cart
      await clearCart(user.id)

      toast.success("Order placed successfully!")
      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      console.error("Error processing order:", error)
      toast.error(error.message || "Failed to process order")
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
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

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-blue-400" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-blue-200 mb-8">Add some products to checkout!</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/shop">Continue Shopping</Link>
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
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-blue-200">Complete your order</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-blue-200">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-blue-200">
                      Shipping Address *
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Any special instructions for your order"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cartData.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.products?.name}</p>
                          <p className="text-blue-300">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-white">{formatPrice((item.products?.price || 0) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-blue-600/50" />

                  <div className="flex justify-between text-blue-200">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartData.subtotal)}</span>
                  </div>

                  {/* Applied Discounts */}
                  {cartData.appliedDiscounts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Applied Discounts
                      </h4>
                      {cartData.appliedDiscounts.map((applied, index) => (
                        <div key={index} className="bg-green-900/20 p-3 rounded-lg">
                          <p className="text-green-300 font-medium text-sm">{applied.discount.name}</p>
                          <div className="flex justify-between text-sm mt-1">
                            {applied.freeQuantity > 0 && (
                              <span className="text-green-200">+{applied.freeQuantity} free items</span>
                            )}
                            <span className="text-green-200">-{formatPrice(applied.discountAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cartData.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span>Total Savings</span>
                      <span>-{formatPrice(cartData.totalDiscount)}</span>
                    </div>
                  )}

                  <Separator className="bg-blue-600/50" />

                  <div className="flex justify-between text-white text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(cartData.finalTotal)}</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>

                  <p className="text-blue-300 text-xs text-center">
                    By placing your order, you agree to our terms and conditions.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  )
}
