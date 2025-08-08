"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Search, Edit, Trash2, Package, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import type { Category, Profile } from "@/lib/supabase"

export default function AdminCategoriesPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
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
      fetchCategories()
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
        .select(`
          *,
          products (count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
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

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    })
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required")
      return false
    }
    if (!formData.slug.trim()) {
      toast.error("Category slug is required")
      return false
    }
    return true
  }

  const handleAdd = async () => {
    if (!validateForm()) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error("A category with this name or slug already exists")
          return
        }
        throw error
      }

      setCategories(prev => [data, ...prev])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("Category created successfully!")
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("Failed to create category")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!validateForm() || !editingCategory) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from("categories")
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
        })
        .eq("id", editingCategory.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error("A category with this name or slug already exists")
          return
        }
        throw error
      }

      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? data : cat)
      )
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      resetForm()
      toast.success("Category updated successfully!")
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    try {
      // Check if category has products
      const { data: products, error: checkError } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", category.id)
        .limit(1)

      if (checkError) throw checkError

      if (products && products.length > 0) {
        toast.error("Cannot delete category with existing products")
        return
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id)

      if (error) throw error

      setCategories(prev => prev.filter(cat => cat.id !== category.id))
      toast.success("Category deleted successfully!")
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredCategories = categories.filter((category) =>
    searchQuery === "" ||
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <h1 className="text-3xl font-bold mb-2">Category Management</h1>
              <p className="text-blue-200">Organize your products with categories</p>
            </div>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Categories</p>
                  <p className="text-2xl font-bold text-white">{categories.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Most Popular</p>
                  <p className="text-lg font-bold text-white">
                    {categories.length > 0 ? categories[0]?.name : "N/A"}
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
                  <p className="text-blue-200 text-sm">Recently Added</p>
                  <p className="text-lg font-bold text-white">
                    {categories.length > 0 ? formatDate(categories[0]?.created_at) : "N/A"}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white">
                Categories ({filteredCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-600/50">
                      <TableHead className="text-blue-200">Name</TableHead>
                      <TableHead className="text-blue-200">Slug</TableHead>
                      <TableHead className="text-blue-200">Description</TableHead>
                      <TableHead className="text-blue-200">Products</TableHead>
                      <TableHead className="text-blue-200">Created</TableHead>
                      <TableHead className="text-blue-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id} className="border-blue-600/30 hover:bg-blue-800/20">
                        <TableCell className="font-semibold text-white">
                          {category.name}
                        </TableCell>
                        <TableCell className="font-mono text-cyan-300">
                          {category.slug}
                        </TableCell>
                        <TableCell className="text-blue-200 max-w-xs">
                          <p className="line-clamp-2">
                            {category.description || "No description"}
                          </p>
                        </TableCell>
                        <TableCell className="text-blue-200">
                          0 products
                        </TableCell>
                        <TableCell className="text-blue-200">
                          {formatDate(category.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditDialog(category)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-blue-900 border-blue-600">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription className="text-blue-200">
                                    Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(category)}
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

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="text-blue-300 text-lg mb-2">No categories found</p>
                    <p className="text-blue-400 mb-4">Create your first category to get started</p>
                    <Button
                      onClick={openAddDialog}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Category Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="bg-blue-900 border-blue-600">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Category</DialogTitle>
              <DialogDescription className="text-blue-200">
                Create a new category to organize your products.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name" className="text-blue-200">
                  Category Name *
                </Label>
                <Input
                  id="add-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="add-slug" className="text-blue-200">
                  Category Slug *
                </Label>
                <Input
                  id="add-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="category-slug"
                />
              </div>
              <div>
                <Label htmlFor="add-description" className="text-blue-200">
                  Description
                </Label>
                <Textarea
                  id="add-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {saving ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-blue-900 border-blue-600">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Category</DialogTitle>
              <DialogDescription className="text-blue-200">
                Update the category information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-blue-200">
                  Category Name *
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug" className="text-blue-200">
                  Category Slug *
                </Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="category-slug"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-blue-200">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {saving ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
