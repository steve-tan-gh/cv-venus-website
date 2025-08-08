"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { getCartItems, updateCartItem, removeFromCart } from "@/lib/cart"
import { toast } from "sonner"
import type { CartItem } from "@/lib/supabase"

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchCartItems(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchCartItems = async (userId: string) => {
    try {
      const items = await getCartItems(userId)
      setCartItems(items)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      toast.error("Failed to load cart items")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity)
      setCartItems((items) =>
        items
          .map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
          .filter((item) => item.quantity > 0),
      )
      toast.success("Cart updated!")
    } catch (error) {
      console.error("Error updating cart item:", error)
      toast.error("Failed to update cart")
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId)
      setCartItems((items) => items.filter((item) => item.id !== itemId))
      toast.success("Item removed from cart!")
    } catch (error) {
      console.error("Error removing cart item:", error)
      toast.error("Failed to remove item")
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0)
  const shipping = subtotal > 100000 ? 0 : 10000 // Free shipping over 100k
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-blue-300/20 h-8 w-32 rounded"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-blue-300/20 h-24 rounded-lg"></div>
            ))}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Shopping Cart</h1>
          <p className="text-blue-200">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-blue-400" />
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-blue-200 mb-8">Add some products to get started!</p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Link href="/shop">
                Continue Shopping <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full sm:w-24 h-24 flex-shrink-0">
                            <Image
                              src={item.products?.image_url || "/placeholder.svg?height=100&width=100"}
                              alt={item.products?.name || "Product"}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-white">{item.products?.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <p className="text-blue-200 text-sm mb-4">
                              Rp {item.products?.price?.toLocaleString("id-ID")} each
                            </p>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= (item.products?.stock || 0)}
                                  className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Item Total */}
                              <div className="text-right">
                                <p className="font-bold text-cyan-300">
                                  Rp {((item.products?.price || 0) * item.quantity).toLocaleString("id-ID")}
                                </p>
                                {item.quantity >= (item.products?.stock || 0) && (
                                  <p className="text-xs text-orange-400">Max stock reached</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                  <div className="space-y-4">
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

                  <Button
                    asChild
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    size="lg"
                  >
                    <Link href="/checkout">
                      Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-3 border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                  >
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
