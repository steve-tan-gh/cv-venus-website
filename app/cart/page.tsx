"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Minus, Plus, Trash2, ShoppingBag, Gift, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { updateCartItemQuantity, removeFromCart, calculateCartWithDiscounts } from "@/lib/cart"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { CartWithDiscounts } from "@/lib/supabase"

export default function CartPage() {
  const [user, setUser] = useState<any>(null)
  const [cartData, setCartData] = useState<CartWithDiscounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchCartData(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchCartData = async (userId: string) => {
    try {
      const data = await calculateCartWithDiscounts(userId)
      setCartData(data)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (!user) return

    setUpdating(cartItemId)
    try {
      await updateCartItemQuantity(cartItemId, newQuantity, user.id)
      await fetchCartData(user.id)
      toast.success("Cart updated successfully!")
    } catch (error: any) {
      console.error("Error updating cart:", error)
      toast.error(error.message || "Failed to update cart")
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (cartItemId: number) => {
    if (!user) return

    try {
      await removeFromCart(cartItemId, user.id)
      await fetchCartData(user.id)
      toast.success("Item removed from cart!")
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
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
            <p className="text-blue-200 mb-8">Add some products to get started!</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/shop">
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
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
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-blue-200">Review your items and proceed to checkout</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-white">Cart Items ({cartData.items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-blue-800/20 rounded-lg">
                    <div className="relative w-20 h-20 bg-blue-700/30 rounded-lg overflow-hidden">
                      {item.products?.image_url ? (
                        <Image
                          src={item.products.image_url || "/placeholder.svg"}
                          alt={item.products.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-blue-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{item.products?.name}</h3>
                      <p className="text-blue-200 text-sm mb-2">{formatPrice(item.products?.price || 0)} each</p>

                      {/* Stock warning */}
                      {(item.products?.stock || 0) <= 5 && (
                        <Badge variant="destructive" className="mb-2">
                          Only {item.products?.stock} left in stock
                        </Badge>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="w-8 h-8 p-0 border-blue-400 text-blue-100 hover:bg-blue-700/50"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-white font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id || item.quantity >= (item.products?.stock || 0)}
                            className="w-8 h-8 p-0 border-blue-400 text-blue-100 hover:bg-blue-700/50"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {formatPrice((item.products?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
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
                <div className="flex justify-between text-blue-200">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartData.subtotal)}</span>
                </div>

                {/* Applied Discounts */}
                {cartData.appliedDiscounts.length > 0 && (
                  <div className="space-y-2">
                    <Separator className="bg-blue-600/50" />
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
                  asChild
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-blue-400 text-blue-100 hover:bg-blue-700/50 bg-transparent"
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
