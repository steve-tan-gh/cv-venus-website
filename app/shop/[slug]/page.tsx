"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Heart, Share2, Truck, Shield, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { addToCart } from "@/lib/cart"
import { toast } from "sonner"
import type { Product } from "@/lib/supabase"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (id, name),
          brands (id, name, logo_url)
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setProduct(data)

      // Fetch related products
      if (data) {
        const { data: related } = await supabase
          .from("products")
          .select(`
            *,
            categories (name),
            brands (name)
          `)
          .eq("category_id", data.category_id)
          .neq("id", data.id)
          .eq("is_active", true)
          .limit(4)

        setRelatedProducts(related || [])
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      router.push("/shop")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add items to cart")
      return
    }

    if (!product) return

    try {
      await addToCart(user.id, product.id, quantity)
      toast.success(`${quantity} item(s) added to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    }
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-blue-300/20 h-8 w-32 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-blue-300/20 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-blue-300/20 h-8 rounded"></div>
                <div className="bg-blue-300/20 h-4 rounded w-2/3"></div>
                <div className="bg-blue-300/20 h-20 rounded"></div>
                <div className="bg-blue-300/20 h-12 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen text-white">
        <VenusBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button asChild variant="ghost" className="text-blue-200 hover:text-white p-0">
            <Link href="/shop" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Link>
          </Button>
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Product Image */}
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative aspect-square bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-400/20"
            >
              <Image
                src={product.image_url || "/placeholder.svg?height=500&width=500"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500">Featured</Badge>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <Badge className="absolute top-4 right-4 bg-orange-600">Low Stock</Badge>
              )}
              {product.stock === 0 && <Badge className="absolute top-4 right-4 bg-red-600">Out of Stock</Badge>}
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-blue-400 text-blue-200">
                  {product.categories?.name}
                </Badge>
                <Badge className="bg-blue-600">{product.brands?.name}</Badge>
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                    />
                  ))}
                  <span className="text-blue-200 ml-2">(4.8) • 124 reviews</span>
                </div>
              </div>

              <p className="text-xl font-bold text-cyan-300 mb-4">Rp {product.price.toLocaleString("id-ID")}</p>

              <p className="text-blue-200 leading-relaxed">{product.description}</p>
            </div>

            <Separator className="bg-blue-600/50" />

            {/* Stock and Quantity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Stock Available:</span>
                <span
                  className={`font-semibold ${
                    product.stock > 10 ? "text-green-400" : product.stock > 0 ? "text-orange-400" : "text-red-400"
                  }`}
                >
                  {product.stock} units
                </span>
              </div>

              {product.stock > 0 && (
                <div className="flex items-center space-x-4">
                  <span className="text-blue-200">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user && product.stock > 0 ? (
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              ) : !user ? (
                <Button
                  asChild
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Link href="/auth/signin">Sign In to Purchase</Link>
                </Button>
              ) : (
                <Button disabled size="lg" className="flex-1">
                  Out of Stock
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
              >
                <Heart className="w-5 h-5 mr-2" />
                Wishlist
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-blue-200">
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Authentic Product</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Easy Returns</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 hover:bg-white/15 transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="relative mb-4">
                        <Image
                          src={relatedProduct.image_url || "/placeholder.svg?height=200&width=200"}
                          alt={relatedProduct.name}
                          width={200}
                          height={200}
                          className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-xs">
                          {relatedProduct.brands?.name}
                        </Badge>
                      </div>

                      <h3 className="font-semibold mb-2 text-white group-hover:text-blue-200 transition-colors line-clamp-2">
                        {relatedProduct.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">
                          Rp {relatedProduct.price.toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-blue-200">4.8</span>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="w-full mt-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        size="sm"
                      >
                        <Link href={`/shop/${relatedProduct.slug}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
