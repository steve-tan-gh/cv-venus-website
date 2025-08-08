"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, AlertTriangle, Download, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Product, Category, Brand, Profile } from "@/lib/supabase"

export default function AdminProductsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) throw error

      if (data.role !== "admin") {
        router.push("/")
        return
      }

      setProfile(data)
      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()])
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          ),
          brands (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name")

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId)

      if (error) throw error

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, is_active: !currentStatus }
            : product
        )
      )

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error("Error updating product status:", error)
      toast.error("Failed to update product status")
    }
  }

  const deleteProduct = async (productId: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)

      if (error) throw error

      // Update local state
      setProducts(prevProducts =>
        prevProducts.filter(product => product.id !== productId)
      )

      toast.success("Product deleted successfully!")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const bulkUpdateStatus = async (status: boolean) => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to update")
      return
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          is_active: status,
          updated_at: new Date().toISOString()
        })
        .in("id", selectedProducts)

      if (error) throw error

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          selectedProducts.includes(product.id)
            ? { ...product, is_active: status }
            : product
        )
      )

      setSelectedProducts([])
      toast.success(`${selectedProducts.length} products ${status ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error("Error bulk updating products:", error)
      toast.error("Failed to update products")
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-600" }
    if (stock <= 5) return { label: "Low Stock", color: "bg-orange-600" }
    if (stock <= 10) return { label: "Medium Stock", color: "bg-yellow-600" }
    return { label: "In Stock", color: "bg-green-600" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categories?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brands?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || product.category_id.toString() === categoryFilter
    const matchesBrand = brandFilter === "all" || product.brand_id.toString() === brandFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active)
    
    const matchesStock = stockFilter === "all" ||
      (stockFilter === "out" && product.stock === 0) ||
      (stockFilter === "low" && product.stock > 0 && product.stock <= 5) ||
      (stockFilter === "medium" && product.stock > 5 && product.stock <= 10) ||
      (stockFilter === "high" && product.stock > 10)

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
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
            <div className="bg-blue-300/20 h-96 rounded-lg"></div>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Management</h1>
              <p className="text-blue-200">Manage your product catalog</p>
            </div>
            <div className="flex gap-2">
              <Button
                asChild
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Link href="/admin/products/add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-white">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Active Products</p>
                  <p className="text-2xl font-bold text-white">
                    {products.filter(p => p.is_active).length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Low Stock</p>
                  <p className="text-2xl font-bold text-white">
                    {products.filter(p => p.stock <= 5 && p.stock > 0).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Out of Stock</p>
                  <p className="text-2xl font-bold text-white">
                    {products.filter(p => p.stock === 0).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="high">High Stock (10+)</SelectItem>
                    <SelectItem value="medium">Medium Stock (6-10)</SelectItem>
                    <SelectItem value="low">Low Stock (1-5)</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-blue-800/30 backdrop-blur-sm border-blue-400/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-white">
                    {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => bulkUpdateStatus(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Activate Selected
                    </Button>
                    <Button
                      onClick={() => bulkUpdateStatus(false)}
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-100 hover:bg-orange-800/50"
                    >
                      Deactivate Selected
                    </Button>
                    <Button
                      onClick={() => setSelectedProducts([])}
                      size="sm"
                      variant="ghost"
                      className="text-blue-200 hover:text-white"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white">
                Products ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-600/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-blue-200">Product</TableHead>
                      <TableHead className="text-blue-200">Category</TableHead>
                      <TableHead className="text-blue-200">Brand</TableHead>
                      <TableHead className="text-blue-200">Price</TableHead>
                      <TableHead className="text-blue-200">Stock</TableHead>
                      <TableHead className="text-blue-200">Status</TableHead>
                      <TableHead className="text-blue-200">Created</TableHead>
                      <TableHead className="text-blue-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock)
                      return (
                        <TableRow key={product.id} className="border-blue-600/30 hover:bg-blue-800/20">
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 flex-shrink-0">
                                <Image
                                  src={product.image_url || "/placeholder.svg?height=48&width=48"}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-white">{product.name}</p>
                                <p className="text-blue-300 text-sm line-clamp-1">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-400 text-blue-200">
                              {product.categories?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-600">
                              {product.brands?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-cyan-300">
                            Rp {product.price.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
                              {product.stock} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => toggleProductStatus(product.id, product.is_active)}
                              variant="ghost"
                              size="sm"
                              className="p-0"
                            >
                              <Badge className={product.is_active ? "bg-green-600" : "bg-red-600"}>
                                {product.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </Button>
                          </TableCell>
                          <TableCell className="text-blue-200">
                            {formatDate(product.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/shop/${product.slug}`} target="_blank">
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/products/${product.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-blue-900 border-blue-600">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription className="text-blue-200">
                                      Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteProduct(product.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="text-blue-300 text-lg mb-2">No products found</p>
                    <p className="text-blue-400 mb-4">Try adjusting your search or filters</p>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Link href="/admin/products/add">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Product
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
