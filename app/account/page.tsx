"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Save, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Profile } from "@/lib/supabase"

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchProfile(user.id)
      } else {
        router.push("/auth/signin")
      }
    })
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      console.log("Profile query result:", { data, error })

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log("Profile not found, creating new profile...")
          await createProfile(userId)
          return
        }
        throw error
      }

      setProfile(data)
      setFormData({
        fullName: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData.user?.email || ""
      
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          full_name: userData.user?.user_metadata?.full_name || "",
          role: "user"
        })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        fullName: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
      })
      
      toast.success("Profile created successfully!")
    } catch (error) {
      console.error("Error creating profile:", error)
      toast.error("Failed to create profile")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.fullName,
              phone: formData.phone,
              address: formData.address,
            }
          : null,
      )

      setEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      })
    }
    setEditing(false)
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
          <h1 className="text-3xl font-bold mb-4">My Account</h1>
          <p className="text-blue-200">Manage your profile and account settings</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-white">
                      <User className="w-5 h-5 mr-2" />
                      Profile Information
                    </CardTitle>
                    {!editing && (
                      <Button
                        onClick={() => setEditing(true)}
                        variant="outline"
                        size="sm"
                        className="border-blue-400 text-blue-100 hover:bg-blue-800/50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-blue-200">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400 disabled:opacity-60"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-blue-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.email || ""}
                      disabled
                      className="bg-blue-800/30 border-blue-600 text-blue-300 opacity-60"
                    />
                    <p className="text-blue-300 text-xs mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-blue-200">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400 disabled:opacity-60"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-blue-200">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={3}
                      className="bg-blue-800/50 border-blue-600 text-white placeholder-blue-300 focus:border-blue-400 disabled:opacity-60"
                      placeholder="Enter your address"
                    />
                  </div>

                  {editing && (
                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-blue-200 text-sm">Email</p>
                      <p className="text-white font-semibold">{profile?.email || user?.email}</p>
                    </div>
                  </div>

                  {profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-blue-200 text-sm">Phone</p>
                        <p className="text-white font-semibold">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-200 text-sm">Address</p>
                        <p className="text-white font-semibold">{profile.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-blue-600/50">
                    <p className="text-blue-200 text-sm">Member since</p>
                    <p className="text-white font-semibold">
                      {new Date(profile?.created_at || user?.created_at || "").toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                  >
                    <a href="/orders">View Order History</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                  >
                    <a href="/cart">View Shopping Cart</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-blue-400 text-blue-100 hover:bg-blue-800/50 bg-transparent"
                  >
                    <a href="/shop">Continue Shopping</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
