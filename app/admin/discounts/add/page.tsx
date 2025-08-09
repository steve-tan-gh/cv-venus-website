"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Calendar, Target, Percent, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Category, Brand, Product } from "@/lib/supabase"

export default function AddDiscountPage() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "buy_x_get_y_free" as "buy_x_get_y_free" | "buy_x_get_percentage",
    min_quantity: 1,
    applies_to: "all" as "all" | "category" | "brand" | "product",
    applies_to_id: null as number | null,
    free_quantity: 1,
    discount_percentage: 10,
    is_active: true,
    start_date: "",
    end_date: "",
  })
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, brandsRes, productsRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("brands").select("*").order("name"),
        supabase.from("products").select("*").eq("is_active", true).order("name"),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (brandsRes.data) setBrands(brandsRes.data)
      if (productsRes.data) setProducts(productsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load form data")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a discount name")
      return
    }

    if (formData.min_quantity < 1) {
      toast.error("Minimum quantity must be at least 1")
      return
    }

    if (formData.type === "buy_x_get_y_free" && formData.free_quantity < 1) {
      toast.error("Free quantity must be at least 1")
      return
    }

    if (
      formData.type === "buy_x_get_percentage" &&
      (formData.discount_percentage < 1 || formData.discount_percentage > 100)
    ) {
      toast.error("Discount percentage must be between 1 and 100")
      return
    }

    if (formData.applies_to !== "all" && !formData.applies_to_id) {
      toast.error("Please select a target for the discount")
      return
    }

    setLoading(true)

    try {
      const discountData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        min_quantity: formData.min_quantity,
        applies_to: formData.applies_to,
        applies_to_id: formData.applies_to !== "all" ? formData.applies_to_id : null,
        free_quantity: formData.type === "buy_x_get_y_free" ? formData.free_quantity : null,
        discount_percentage: formData.type === "buy_x_get_percentage" ? formData.discount_percentage : null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      const { error } = await supabase.from("discounts").insert(discountData)

      if (error) throw error

      toast.success("Discount created successfully!")
      router.push("/admin/discounts")
    } catch (error: any) {
      console.error("Error creating discount:", error)
      toast.error(error.message || "Failed to create discount")
    } finally {
      setLoading(false)
    }
  }

  const getTargetOptions = () => {
    switch (formData.applies_to) {
      case "category":
        return categories.map((cat) => ({ value: cat.id, label: cat.name }))
      case "brand":
        return brands.map((brand) => ({ value: brand.id, label: brand.name }))
      case "product":
        return products.map((product) => ({ value: product.id, label: product.name }))
      default:
        return []
    }
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
            Back to Discounts
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create New Discount</h1>
          <p className="text-blue-200">Set up a new promotional discount</p>
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
                        Discount Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="e.g., Summer Sale 2024"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-blue-200">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        placeholder="Describe the discount offer..."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active" className="text-blue-200">
                        Active
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Discount Configuration */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Percent className="w-5 h-5" />
                      Discount Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="type" className="text-blue-200">
                        Discount Type *
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: "buy_x_get_y_free" | "buy_x_get_percentage") =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy_x_get_y_free">
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4" />
                              Buy X Get Y Free
                            </div>
                          </SelectItem>
                          <SelectItem value="buy_x_get_percentage">
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4" />
                              Buy X Get Percentage Off
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_quantity" className="text-blue-200">
                          Minimum Quantity *
                        </Label>
                        <Input
                          id="min_quantity"
                          type="number"
                          min="1"
                          value={formData.min_quantity}
                          onChange={(e) =>
                            setFormData({ ...formData, min_quantity: Number.parseInt(e.target.value) || 1 })
                          }
                          className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        />
                      </div>

                      {formData.type === "buy_x_get_y_free" ? (
                        <div>
                          <Label htmlFor="free_quantity" className="text-blue-200">
                            Free Quantity *
                          </Label>
                          <Input
                            id="free_quantity"
                            type="number"
                            min="1"
                            value={formData.free_quantity}
                            onChange={(e) =>
                              setFormData({ ...formData, free_quantity: Number.parseInt(e.target.value) || 1 })
                            }
                            className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="discount_percentage" className="text-blue-200">
                            Discount Percentage *
                          </Label>
                          <Input
                            id="discount_percentage"
                            type="number"
                            min="1"
                            max="100"
                            value={formData.discount_percentage}
                            onChange={(e) =>
                              setFormData({ ...formData, discount_percentage: Number.parseInt(e.target.value) || 10 })
                            }
                            className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Target Configuration */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Target Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="applies_to" className="text-blue-200">
                        Applies To *
                      </Label>
                      <Select
                        value={formData.applies_to}
                        onValueChange={(value: "all" | "category" | "brand" | "product") =>
                          setFormData({ ...formData, applies_to: value, applies_to_id: null })
                        }
                      >
                        <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="category">Specific Category</SelectItem>
                          <SelectItem value="brand">Specific Brand</SelectItem>
                          <SelectItem value="product">Specific Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.applies_to !== "all" && (
                      <div>
                        <Label htmlFor="target" className="text-blue-200">
                          Select Target *
                        </Label>
                        <Select
                          value={formData.applies_to_id?.toString() || ""}
                          onValueChange={(value) => setFormData({ ...formData, applies_to_id: Number.parseInt(value) })}
                        >
                          <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                            <SelectValue placeholder={`Select ${formData.applies_to}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {getTargetOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Date Configuration */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Schedule (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date" className="text-blue-200">
                          Start Date
                        </Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_date" className="text-blue-200">
                          End Date
                        </Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Preview */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-2">{formData.name || "Discount Name"}</h3>
                    {formData.description && <p className="text-blue-200 text-sm mb-3">{formData.description}</p>}

                    <div className="space-y-2">
                      <Badge className={formData.is_active ? "bg-green-600" : "bg-gray-600"}>
                        {formData.is_active ? "Active" : "Inactive"}
                      </Badge>

                      <div className="text-sm text-blue-200">
                        <p>
                          <strong>Type:</strong>{" "}
                          {formData.type === "buy_x_get_y_free" ? "Buy X Get Y Free" : "Percentage Discount"}
                        </p>
                        <p>
                          <strong>Minimum:</strong> {formData.min_quantity} items
                        </p>
                        {formData.type === "buy_x_get_y_free" ? (
                          <p>
                            <strong>Free:</strong> {formData.free_quantity} items
                          </p>
                        ) : (
                          <p>
                            <strong>Discount:</strong> {formData.discount_percentage}% off
                          </p>
                        )}
                        <p>
                          <strong>Applies to:</strong>{" "}
                          {formData.applies_to === "all"
                            ? "All products"
                            : `${formData.applies_to} ${
                                formData.applies_to_id
                                  ? getTargetOptions().find((opt) => opt.value === formData.applies_to_id)?.label || ""
                                  : "(not selected)"
                              }`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Discount
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
