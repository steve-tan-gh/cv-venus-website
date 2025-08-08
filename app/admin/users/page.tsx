"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Users, Search, Filter, Edit, Trash2, Mail, Phone, Calendar, ShoppingBag, DollarSign, RefreshCw, UserPlus, Shield, User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Profile } from "@/lib/supabase"

interface UserWithStats extends Profile {
  order_count: number
  total_spent: number
  last_order_date: string | null
}

export default function UsersManagement() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null)
  const [editRole, setEditRole] = useState("")

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    activeUsers: 0
  })

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user)
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
      await fetchUsers()
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...")
      
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        throw profilesError
      }

      console.log("Profiles fetched:", profiles?.length || 0)

      if (!profiles || profiles.length === 0) {
        setUsers([])
        setFilteredUsers([])
        updateStats([])
        return
      }

      // Then get order statistics for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from("orders")
              .select("total, created_at")
              .eq("user_id", profile.id)

            if (ordersError) {
              console.error(`Error fetching orders for user ${profile.id}:`, ordersError)
            }

            const orderCount = orders?.length || 0
            const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
            const lastOrderDate = orders && orders.length > 0 
              ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
              : null

            return {
              ...profile,
              order_count: orderCount,
              total_spent: totalSpent,
              last_order_date: lastOrderDate
            }
          } catch (error) {
            console.error(`Error processing user ${profile.id}:`, error)
            return {
              ...profile,
              order_count: 0,
              total_spent: 0,
              last_order_date: null
            }
          }
        })
      )

      console.log("Users with stats:", usersWithStats.length)
      setUsers(usersWithStats)
      setFilteredUsers(usersWithStats)
      updateStats(usersWithStats)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    }
  }

  const updateStats = (userList: UserWithStats[]) => {
    const totalUsers = userList.length
    const adminUsers = userList.filter(user => user.role === "admin").length
    const regularUsers = userList.filter(user => user.role === "user").length
    const activeUsers = userList.filter(user => user.last_order_date).length

    setStats({
      totalUsers,
      adminUsers,
      regularUsers,
      activeUsers
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
    toast.success("Users refreshed successfully!")
  }

  // Filter users based on search term and role
  useEffect(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const handleEditRole = async () => {
    if (!editingUser || !editRole) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: editRole })
        .eq("id", editingUser.id)

      if (error) throw error

      toast.success("User role updated successfully!")
      setEditingUser(null)
      setEditRole("")
      await fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Check if user has orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId)

      if (ordersError) throw ordersError

      if (orders && orders.length > 0) {
        toast.error("Cannot delete user with existing orders")
        return
      }

      // Prevent deleting own account
      if (userId === currentUser?.id) {
        toast.error("Cannot delete your own account")
        return
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (error) throw error

      toast.success("User deleted successfully!")
      await fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-blue-200">Manage user accounts and permissions</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? "Refreshing..." : "Refresh Users"}
              </Button>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Admin Users</p>
                    <p className="text-2xl font-bold text-white">{stats.adminUsers}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Regular Users</p>
                    <p className="text-2xl font-bold text-white">{stats.regularUsers}</p>
                  </div>
                  <User className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4" />
                    <Input
                      placeholder="Search users by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white focus:border-blue-400">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-800 border-blue-600">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">Regular Users</SelectItem>
                      <SelectItem value="admin">Admin Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardHeader>
              <CardTitle className="text-white">Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-600">
                        <TableHead className="text-blue-200">User</TableHead>
                        <TableHead className="text-blue-200">Contact</TableHead>
                        <TableHead className="text-blue-200">Role</TableHead>
                        <TableHead className="text-blue-200">Orders</TableHead>
                        <TableHead className="text-blue-200">Total Spent</TableHead>
                        <TableHead className="text-blue-200">Last Order</TableHead>
                        <TableHead className="text-blue-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-blue-600/50">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{user.full_name || 'No Name'}</p>
                              <p className="text-blue-300 text-sm">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-200 text-sm">{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-blue-400" />
                                  <span className="text-blue-200 text-sm">{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  User
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-blue-400" />
                              <span className="text-white">{user.order_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-white">{formatCurrency(user.total_spent)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-200 text-sm">{formatDate(user.last_order_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(user)
                                      setEditRole(user.role)
                                    }}
                                    className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-blue-900 border-blue-600">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Edit User Role</DialogTitle>
                                    <DialogDescription className="text-blue-200">
                                      Change the role for {editingUser?.full_name || editingUser?.email}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="role" className="text-blue-200">Role</Label>
                                      <Select value={editRole} onValueChange={setEditRole}>
                                        <SelectTrigger className="bg-blue-800/50 border-blue-600 text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-blue-800 border-blue-600">
                                          <SelectItem value="user">Regular User</SelectItem>
                                          <SelectItem value="admin">Admin User</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingUser(null)
                                        setEditRole("")
                                      }}
                                      className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleEditRole}
                                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                      Update Role
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={user.id === currentUser?.id || user.order_count > 0}
                                    className="border-red-400 text-red-100 hover:bg-red-800/50 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-blue-900 border-blue-600">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                                    <AlertDialogDescription className="text-blue-200">
                                      Are you sure you want to delete {user.full_name || user.email}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-blue-400 text-blue-100 hover:bg-blue-800/50">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
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
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <p className="text-blue-200 mb-2">No users found</p>
                  <p className="text-blue-300 text-sm">
                    {searchTerm || roleFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "No users have been registered yet"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
