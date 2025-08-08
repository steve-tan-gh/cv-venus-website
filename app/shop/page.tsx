"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Grid, List, Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { addToCart } from "@/lib/cart"
import { toast } from "sonner"
import type { Product, Category, Brand } from "@/lib/supabase"

export default function ShopPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedBrands, setSelectedBrands] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase
          .from("products")
          .select(`
            *,
            categories (id, name),
            brands (id, name, logo_url)
          `)
          .eq("is_active", true),
        supabase.from("categories").select("*"),
        supabase.from("brands").select("*"),
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (brandsRes.error) throw brandsRes.error

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setBrands(brandsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.categories?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brands?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => selectedCategories.includes(product.category_id))
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => selectedBrands.includes(product.brand_id))
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "name":
          return a.name.localeCompare(b.name)
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchQuery, selectedCategories, selectedBrands, sortBy])

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      toast.error("Please sign in to add items to cart")
      return
    }

    try {
      await addToCart(user.id, productId, 1)
      toast.success("Item added to cart!")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    }
  }

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId])
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    }
  }

  const handleBrandChange = (brandId: number, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brandId])
    } else {
      setSelectedBrands(selectedBrands.filter((id) => id !== brandId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setSelectedBrands([])
    setSortBy("name")
  }

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Shop</h1>
          <p className="text-blue-200">Discover our premium products from trusted brands</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-blue-800/50 border-blue-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-blue-600 rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-800/30 backdrop-blur-sm rounded-lg p-6 border border-blue-600/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categories */}
                  <div>
                    <h3 className="font-semibold mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                          />
                          <Label htmlFor={`category-${category.id}`} className="text-blue-100">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <h3 className="font-semibold mb-3">Brands</h3>
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand.id}`}
                            checked={selectedBrands.includes(brand.id)}
                            onCheckedChange={(checked) => handleBrandChange(brand.id, checked as boolean)}
                          />
                          <Label htmlFor={`brand-${brand.id}`} className="text-blue-100">
                            {brand.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
          <p className="text-blue-200">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </motion.div>

        {/* Products Grid/List */}
        {loading ? (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="bg-blue-300/20 h-48 rounded-lg mb-4"></div>
                    <div className="bg-blue-300/20 h-4 rounded mb-2"></div>
                    <div className="bg-blue-300/20 h-4 rounded w-2/3 mb-4"></div>
                    <div className="bg-blue-300/20 h-8 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <p className="text-xl text-blue-200 mb-4">No products found</p>
            <p className="text-blue-300 mb-6">Try adjusting your search or filters</p>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`grid gap-6 ${
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            }`}
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card
                  className={`bg-white/10 backdrop-blur-sm border-blue-400/20 hover:bg-white/15 transition-all duration-300 group h-full ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <CardContent className={`p-6 ${viewMode === "list" ? "flex gap-6 items-center w-full" : ""}`}>
                    <div className={`relative ${viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "mb-4"}`}>
                      <Image
                        src={product.image_url || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        width={200}
                        height={200}
                        className={`object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "list" ? "w-full h-full" : "w-full h-48"
                        }`}
                      />
                      <Badge className="absolute top-2 right-2 bg-blue-600">{product.brands?.name}</Badge>
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge className="absolute top-2 left-2 bg-orange-600">Low Stock</Badge>
                      )}
                      {product.stock === 0 && <Badge className="absolute top-2 left-2 bg-red-600">Out of Stock</Badge>}
                    </div>

                    <div className={`${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className={`${viewMode === "list" ? "flex justify-between items-start" : ""}`}>
                        <div className={`${viewMode === "list" ? "flex-1 mr-4" : ""}`}>
                          <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-blue-200 transition-colors">
                            {product.name}
                          </h3>

                          <p className="text-blue-200 text-sm mb-3 line-clamp-2">{product.description}</p>

                          <div className="flex items-center space-x-2 mb-3">
                            <Badge variant="outline" className="border-blue-400 text-blue-200">
                              {product.categories?.name}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-blue-200">4.8</span>
                            </div>
                          </div>
                        </div>

                        <div className={`${viewMode === "list" ? "text-right" : ""}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-bold text-cyan-300">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-sm text-blue-300">Stock: {product.stock}</span>
                          </div>

                          <div className={`flex gap-2 ${viewMode === "list" ? "justify-end" : ""}`}>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                            >
                              <Link href={`/shop/${product.slug}`}>View Details</Link>
                            </Button>

                            {user && product.stock > 0 && (
                              <Button
                                onClick={() => handleAddToCart(product.id)}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                              >
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                Add to Cart
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
