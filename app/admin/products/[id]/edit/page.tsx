"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    comparePrice: "",
    stock: "",
    sku: "",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    isActive: true,
    isFeatured: false,
  })

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
      await Promise.all([
        fetchProduct(),
        fetchCategories(),
        fetchBrands()
      ])
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchProduct = async () => {
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
        .eq("id", productId)
        .single()

      if (error) throw error

      if (!data) {
        toast.error("Product not found")
        router.push("/admin/products")
        return
      }

      setProduct(data)
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        price: data.price.toString(),
        comparePrice: data.compare_price?.toString() || "",
        stock: data.stock.toString(),
        sku: data.sku || "",
        categoryId: data.category_id?.toString() || "",
        brandId: data.brand_id?.toString() || "",
        imageUrl: data.image_url || "",
        isActive: data.is_active,
        isFeatured: data.is_featured,
      })
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Failed to load product")
      router.push("/admin/products")
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Auto-generate slug when name changes (but only if slug hasn't been manually edited)
      ...(name === 'name' && prev.slug === generateSlug(prev.name) && { slug: generateSlug(value) })
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required")
      return false
    }
    if (!formData.slug.trim()) {
      toast.error("Product slug is required")
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required")
      return false
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error("Valid stock quantity is required")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)

    try {
      const updateData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        compare_price: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || null,
        category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
        brand_id: formData.brandId ? parseInt(formData.brandId) : null,
        image_url: formData.imageUrl.trim() || null,
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId)

      if (error) {
        if (error.code === '23505') {
          toast.error("A product with this name or slug already exists")
          return
        }
        throw error
      }

      toast.success("Product updated successfully!")
      router.push("/admin/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)

      if (error) throw error

      toast.success("Product deleted successfully!")
      router.push("/admin/products")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setDeleting(false)
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
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push("/admin/products")}
              variant="outline"
              size="sm"
              className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
              <p className="text-blue-200">Update product information and settings</p>
            </div>
            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-400 text-red-100 hover:bg-red-800/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-blue-900 border-blue-600">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
                    <AlertDialogDescription className="text-blue-200">
                      Are you sure you want to delete "{product?.name}"? This action cannot be undone and will remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? "Deleting..." : "Delete Product"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-blue-200">
                        Product Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug" className="text-blue-200">
                        Product Slug *
                      </Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="product-slug"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-blue-200">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Enter product description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku" className="text-blue-200">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="Enter SKU"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing & Inventory */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-blue-200">
                        Price (Rp) *
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="comparePrice" className="text-blue-200">
                        Compare Price (Rp)
                      </Label>
                      <Input
                        id="comparePrice"
                        name="comparePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.comparePrice}
                        onChange={handleInputChange}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock" className="text-blue-200">
                        Stock Quantity *
                      </Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Categories & Brand */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Categories & Brand</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryId" className="text-blue-200">
                        Category
                      </Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleSelectChange("categoryId", value)}
                      >
                        <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white focus:border-blue-400">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-800 border-blue-600">
                          <SelectItem value="none">No Category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="brandId" className="text-blue-200">
                        Brand
                      </Label>
                      <Select
                        value={formData.brandId}
                        onValueChange={(value) => handleSelectChange("brandId", value)}
                      >
                        <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white focus:border-blue-400">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-800 border-blue-600">
                          <SelectItem value="none">No Brand</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Product Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive" className="text-blue-200">
                      Active
                    </Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured" className="text-blue-200">
                      Featured
                    </Label>
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleSwitchChange("isFeatured", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Product Image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Product Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl" className="text-blue-200">
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {!formData.imageUrl && (
                    <div className="border-2 border-dashed border-blue-600 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-blue-200 text-sm mb-1">Upload Image</p>
                      <p className="text-blue-300 text-xs">Drag & drop or click to browse</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 border-blue-400 text-blue-100 hover:bg-blue-800/50"
                      >
                        Choose File
                      </Button>
                    </div>
                  )}

                  {formData.imageUrl && (
                    <div className="relative">
                      <Image
                        src={formData.imageUrl || "/placeholder.svg"}
                        alt="Product preview"
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
