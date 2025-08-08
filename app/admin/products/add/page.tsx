"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Category, Brand, Profile } from "@/lib/supabase"

export default function AddProductPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    isFeatured: false,
    isActive: true,
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
      await Promise.all([fetchCategories(), fetchBrands()])
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
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
      // Auto-generate slug when name changes
      ...(name === 'name' && { slug: generateSlug(value) })
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
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
    if (!formData.categoryId) {
      toast.error("Category is required")
      return false
    }
    if (!formData.brandId) {
      toast.error("Brand is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category_id: parseInt(formData.categoryId),
          brand_id: parseInt(formData.brandId),
          image_url: formData.imageUrl.trim() || null,
          is_featured: formData.isFeatured,
          is_active: formData.isActive,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error("A product with this name or slug already exists")
          return
        }
        throw error
      }

      toast.success("Product created successfully!")
      router.push("/admin/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product")
    } finally {
      setSaving(false)
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
          <Button asChild variant="ghost" className="text-blue-200 hover:text-white p-0 mb-4">
            <Link href="/admin/products" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-4">Add New Product</h1>
          <p className="text-blue-200">Create a new product for your catalog</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-blue-200">
                        Product Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
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
                        type="text"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="product-slug"
                      />
                      <p className="text-blue-300 text-xs mt-1">
                        URL-friendly version of the name (auto-generated)
                      </p>
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
                        rows={4}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="Enter product description"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          required
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
                          required
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
                          Category *
                        </Label>
                        <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)}>
                          <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
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
                          Brand *
                        </Label>
                        <Select value={formData.brandId} onValueChange={(value) => handleSelectChange('brandId', value)}>
                          <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
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
              {/* Product Image */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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

                    <div className="border-2 border-dashed border-blue-600 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                      <p className="text-blue-200 mb-2">Upload Image</p>
                      <p className="text-blue-300 text-sm">Drag & drop or click to browse</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 border-blue-400 text-blue-100 hover:bg-blue-800/50"
                      >
                        Choose File
                      </Button>
                    </div>

                    {formData.imageUrl && (
                      <div className="relative">
                        <img
                          src={formData.imageUrl || "/placeholder.svg"}
                          alt="Product preview"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=200"
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

              {/* Product Settings */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white">Product Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleCheckboxChange('isFeatured', checked as boolean)}
                      />
                      <Label htmlFor="isFeatured" className="text-blue-200">
                        Featured Product
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleCheckboxChange('isActive', checked as boolean)}
                      />
                      <Label htmlFor="isActive" className="text-blue-200">
                        Active Product
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Creating Product..." : "Create Product"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                        onClick={() => router.push("/admin/products")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
