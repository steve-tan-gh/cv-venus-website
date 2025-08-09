"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Search, Edit, Trash2, Gift, Percent, Calendar, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
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
import type { Discount, Category, Brand, Profile } from "@/lib/supabase"

export default function AdminDiscountsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error

      if (data.role !== "admin") {
        router.push("/")
        return
      }

      setProfile(data)
      await Promise.all([fetchDiscounts(), fetchCategories(), fetchBrands()])
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase.from("discounts").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setDiscounts(data || [])
    } catch (error) {
      console.error("Error fetching discounts:", error)
      toast.error("Failed to load discounts")
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from("brands").select("*").order("name")

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const toggleDiscountStatus = async (discountId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("discounts")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", discountId)

      if (error) throw error

      // Update local state
      setDiscounts((prevDiscounts) =>
        prevDiscounts.map((discount) =>
          discount.id === discountId ? { ...discount, is_active: !currentStatus } : discount,
        ),
      )

      toast.success(`Discount ${!currentStatus ? "activated" : "deactivated"} successfully!`)
    } catch (error) {
      console.error("Error updating discount status:", error)
      toast.error("Failed to update discount status")
    }
  }

  const deleteDiscount = async (discountId: number) => {
    try {
      const { error } = await supabase.from("discounts").delete().eq("id", discountId)

      if (error) throw error

      // Update local state
      setDiscounts((prevDiscounts) => prevDiscounts.filter((discount) => discount.id !== discountId))

      toast.success("Discount deleted successfully!")
    } catch (error) {
      console.error("Error deleting discount:", error)
      toast.error("Failed to delete discount")
    }
  }

  const getAppliesTo = (discount: Discount) => {
    switch (discount.applies_to) {
      case "all":
        return "All Products"
      case "category":
        const category = categories.find((c) => c.id === discount.applies_to_id)
        return category ? `Category: ${category.name}` : "Category: Unknown"
      case "brand":
        const brand = brands.find((b) => b.id === discount.applies_to_id)
        return brand ? `Brand: ${brand.name}` : "Brand: Unknown"
      case "product":
        return `Product ID: ${discount.applies_to_id}`
      default:
        return "Unknown"
    }
  }

  const getDiscountValue = (discount: Discount) => {
    if (discount.type === "buy_x_get_y_free") {
      return `Buy ${discount.min_quantity}, Get ${discount.free_quantity} Free`
    } else {
      return `Buy ${discount.min_quantity}, Get ${discount.discount_percentage}% Off`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isDiscountActive = (discount: Discount) => {
    if (!discount.is_active) return false

    const now = new Date()
    const startDate = discount.start_date ? new Date(discount.start_date) : null
    const endDate = discount.end_date ? new Date(discount.end_date) : null

    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false

    return true
  }

  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch =
      searchQuery === "" ||
      discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || discount.type === typeFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isDiscountActive(discount)) ||
      (statusFilter === "inactive" && !isDiscountActive(discount))

    return matchesSearch && matchesType && matchesStatus
  })

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
              <h1 className="text-3xl font-bold mb-2">Discount Management</h1>
              <p className="text-blue-200">Create and manage promotional discounts</p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Link href="/admin/discounts/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Discount
              </Link>
            </Button>
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
                  <p className="text-blue-200 text-sm">Total Discounts</p>
                  <p className="text-2xl font-bold text-white">{discounts.length}</p>
                </div>
                <Gift className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Active Discounts</p>
                  <p className="text-2xl font-bold text-white">{discounts.filter((d) => isDiscountActive(d)).length}</p>
                </div>
                <Gift className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Buy X Get Y Free</p>
                  <p className="text-2xl font-bold text-white">
                    {discounts.filter((d) => d.type === "buy_x_get_y_free").length}
                  </p>
                </div>
                <Gift className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Percentage Discounts</p>
                  <p className="text-2xl font-bold text-white">
                    {discounts.filter((d) => d.type === "buy_x_get_percentage").length}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-orange-400" />
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search discounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                    />
                  </div>
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy_x_get_y_free">Buy X Get Y Free</SelectItem>
                    <SelectItem value="buy_x_get_percentage">Percentage Discount</SelectItem>
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Discounts Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white">Discounts ({filteredDiscounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-600/50">
                      <TableHead className="text-blue-200">Name</TableHead>
                      <TableHead className="text-blue-200">Type</TableHead>
                      <TableHead className="text-blue-200">Value</TableHead>
                      <TableHead className="text-blue-200">Applies To</TableHead>
                      <TableHead className="text-blue-200">Status</TableHead>
                      <TableHead className="text-blue-200">Dates</TableHead>
                      <TableHead className="text-blue-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDiscounts.map((discount) => (
                      <TableRow key={discount.id} className="border-blue-600/30 hover:bg-blue-800/20">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-white">{discount.name}</p>
                            <p className="text-blue-300 text-sm">{discount.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={discount.type === "buy_x_get_y_free" ? "bg-purple-600" : "bg-orange-600"}>
                            {discount.type === "buy_x_get_y_free" ? (
                              <Gift className="w-3 h-3 mr-1" />
                            ) : (
                              <Percent className="w-3 h-3 mr-1" />
                            )}
                            {discount.type === "buy_x_get_y_free" ? "Free Items" : "Percentage"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{getDiscountValue(discount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-400 text-blue-200">
                            <Target className="w-3 h-3 mr-1" />
                            {getAppliesTo(discount)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={discount.is_active}
                              onCheckedChange={() => toggleDiscountStatus(discount.id, discount.is_active)}
                            />
                            <Badge className={isDiscountActive(discount) ? "bg-green-600" : "bg-red-600"}>
                              {isDiscountActive(discount) ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-blue-200 text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>Start: {discount.start_date ? formatDate(discount.start_date) : "No limit"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>End: {discount.end_date ? formatDate(discount.end_date) : "No limit"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/discounts/${discount.id}/edit`}>
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
                                  <AlertDialogTitle className="text-white">Delete Discount</AlertDialogTitle>
                                  <AlertDialogDescription className="text-blue-200">
                                    Are you sure you want to delete "{discount.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDiscount(discount.id)}
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
                    ))}
                  </TableBody>
                </Table>

                {filteredDiscounts.length === 0 && (
                  <div className="text-center py-8">
                    <Gift className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="text-blue-300 text-lg mb-2">No discounts found</p>
                    <p className="text-blue-400 mb-4">Try adjusting your search or filters</p>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Link href="/admin/discounts/add">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Discount
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
