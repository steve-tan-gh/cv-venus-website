"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { MapPin, Phone, Mail, Clock, Award, Users, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { VenusBackground } from "@/components/ui/venus-background"
import { Navbar } from "@/components/navbar"

export default function AboutPage() {
  const brands = [
    {
      name: "Garuda Food",
      logo: "/garudafood-seeklogo.png?height=80&width=120",
      description: "Premium Indonesian snack brand known for quality and taste",
    },
    {
      name: "Mondelez",
      logo: "/mondelez_logo.png?height=80&width=120",
      description: "International confectionery company with beloved global brands",
    },
    {
      name: "Cleo",
      logo: "/logo_cleo.png?height=80&width=120",
      description: "Pure mineral water brand trusted by Indonesian families",
    },
  ]

  const features = [
    {
      icon: Award,
      title: "Official Distributor",
      description: "Authorized distributor ensuring 100% authentic products",
    },
    {
      icon: Users,
      title: "Trusted by Thousands",
      description: "Serving customers across North Halmahera with excellence",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Quick and reliable delivery to your doorstep",
    },
  ]

  return (
    <div className="min-h-screen text-white">
      <VenusBackground />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
            About CV. Venus
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for premium quality products in North Halmahera. We are the official distributor of
            renowned brands, committed to bringing you authentic products with exceptional service.
          </p>
        </motion.section>

        {/* Company Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-blue-200">
                <p>
                  Founded with a vision to bring premium quality products to the people of North Halmahera, CV. Venus
                  has established itself as a trusted name in the distribution industry.
                </p>
                <p>
                  As an official distributor of Garuda Food, Mondelez, and Cleo, we ensure that every product that
                  reaches our customers meets the highest standards of quality and authenticity.
                </p>
                <p>
                  Our commitment goes beyond just distribution - we strive to build lasting relationships with our
                  customers by providing exceptional service and reliable delivery across the region.
                </p>
              </div>
            </div>
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-blue-400/20"
              >
                <Image
                  src="/cv-venus-prof.jpg?height=300&width=400"
                  alt="CV. Venus Warehouse"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <p className="text-center text-blue-200">Our modern distribution facility</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Brand Partners */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Brand Partners</h2>
            <p className="text-blue-200">Official distributor of premium brands</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-32 h-20 mx-auto mb-6 bg-transparant rounded-lg flex items-center justify-center">
                      <Image
                        src={brand.logo || "/placeholder.svg"}
                        alt={brand.name}
                        width={120}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{brand.name}</h3>
                    <p className="text-blue-200">{brand.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CV. Venus?</h2>
            <p className="text-blue-200">Your trusted partner for quality products</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact Information */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-blue-200">We're here to serve you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-blue-200 text-sm">North Halmahera, Indonesia</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-blue-200 text-sm">+62 822-6184-5661</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-blue-200 text-sm">TBA</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Hours</h3>
                <p className="text-blue-200 text-sm">Mon-Sat: 8AM-5PM</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Map Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-blue-400/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-blue-200">Our Service Area</h2>
              <div className="bg-blue-800/30 rounded-lg p-8 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2 text-blue-200">North Halmahera Region</h3>
                <p className="text-blue-200">
                  We proudly serve customers throughout North Halmahera, ensuring fast and reliable delivery to your
                  location. Contact us to confirm delivery availability in your area.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}
