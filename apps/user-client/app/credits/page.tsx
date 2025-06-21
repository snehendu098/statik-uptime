"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Zap, Star, Crown, CheckCircle, CreditCard } from "lucide-react"

const creditPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    price: 9.99,
    popular: false,
    features: ["100 monitoring credits", "Basic email notifications", "30-day history", "Standard support"],
  },
  {
    id: "professional",
    name: "Professional Pack",
    credits: 500,
    price: 39.99,
    popular: true,
    features: [
      "500 monitoring credits",
      "Email & SMS notifications",
      "90-day history",
      "Priority support",
      "Custom check intervals",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 1500,
    price: 99.99,
    popular: false,
    features: [
      "1500 monitoring credits",
      "All notification types",
      "1-year history",
      "24/7 premium support",
      "Advanced analytics",
      "API access",
    ],
  },
]

export default function CreditsPage() {
  const [mounted, setMounted] = useState(false)
  const [currentCredits] = useState(150) // Mock current credits
  const [userName] = useState("H4B") // Mock user name
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId)
    // Handle purchase logic here
    console.log("Purchasing package:", packageId)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#000e02] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00bf63]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000e02] animate-fade-in">
      {/* Navbar */}
      <Navbar credits={currentCredits} userName={userName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-slide-in-left">
          <h2 className="text-3xl font-bold text-white mb-2 transition-colors duration-300 hover:text-[#00bf63]">
            Add Credits
          </h2>
          <p className="text-gray-400 transition-colors duration-300">
            Purchase monitoring credits to keep your websites monitored 24/7
          </p>
        </div>

        {/* Current Credits Card */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-[#00bf63]" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-[#00bf63]">{currentCredits}</div>
                <p className="text-sm text-gray-400 mt-1">monitoring credits available</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Estimated usage</p>
                <p className="text-lg font-semibold text-white">~30 days</p>
                <p className="text-xs text-gray-500">based on current monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {creditPackages.map((pkg, index) => (
            <Card
              key={pkg.id}
              className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 animate-fade-in-up group cursor-pointer relative ${
                pkg.popular ? "border-[#00bf63] shadow-lg shadow-[#00bf63]/10" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#00bf63] text-[#000e02] font-semibold px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {pkg.id === "starter" && <CreditCard className="w-12 h-12 text-[#00bf63]" />}
                  {pkg.id === "professional" && <Zap className="w-12 h-12 text-[#00bf63]" />}
                  {pkg.id === "enterprise" && <Crown className="w-12 h-12 text-[#00bf63]" />}
                </div>
                <CardTitle className="text-xl text-white group-hover:text-[#00bf63] transition-colors duration-300">
                  {pkg.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white group-hover:text-[#00bf63] transition-colors duration-300">
                    ${pkg.price}
                  </span>
                  <div className="text-sm text-gray-400 mt-1">{pkg.credits} credits</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[#00bf63] mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={selectedPackage === pkg.id}
                  className={`w-full mt-6 ${
                    pkg.popular
                      ? "bg-[#00bf63] hover:bg-[#00a555] text-[#000e02]"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                  } font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {selectedPackage === pkg.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Purchase Credits"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How Credits Work */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm animate-fade-in-up animation-delay-400">
          <CardHeader>
            <CardTitle className="text-white">How Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Credit Usage</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 1 credit = 1 website check</li>
                  <li>• Credits are consumed based on your check intervals</li>
                  <li>• More frequent checks = more credits used</li>
                  <li>• Unused credits never expire</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Example Usage</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 5-minute checks: ~288 credits/day per site</li>
                  <li>• 15-minute checks: ~96 credits/day per site</li>
                  <li>• 1-hour checks: ~24 credits/day per site</li>
                  <li>• 1-day checks: ~1 credit/day per site</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
