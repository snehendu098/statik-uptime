"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Search, Plus } from "lucide-react"
import { Anton } from "next/font/google"
import Link from "next/link"
import {useUser} from "@civic/auth/react"
import { WalletConnectButton } from "@/components/WalletProvider"

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
})

const monitorData = [
  {
    rank: 1,
    id: "example-com",
    url: "https://example.com",
    status: "Active",
    lastChecked: "2 min ago",
    uptime: "99.9%",
  },
  {
    rank: 2,
    id: "mystore-com",
    url: "https://mystore.com",
    status: "Active",
    lastChecked: "1 min ago",
    uptime: "98.7%",
  },
  {
    rank: 3,
    id: "blog-website-com",
    url: "https://blog.website.com",
    status: "Down",
    lastChecked: "5 min ago",
    uptime: "95.2%",
  },
  {
    rank: 4,
    id: "api-service-com",
    url: "https://api.service.com",
    status: "Active",
    lastChecked: "3 min ago",
    uptime: "99.5%",
  },
  {
    rank: 5,
    id: "dashboard-app-com",
    url: "https://dashboard.app.com",
    status: "Active",
    lastChecked: "1 min ago",
    uptime: "97.8%",
  },
  {
    rank: 6,
    id: "portfolio-dev-com",
    url: "https://portfolio.dev.com",
    status: "Active",
    lastChecked: "4 min ago",
    uptime: "99.1%",
  },
  {
    rank: 7,
    id: "ecommerce-shop-com",
    url: "https://ecommerce.shop.com",
    status: "Down",
    lastChecked: "7 min ago",
    uptime: "92.3%",
  },
]



export default function SolanaStakingPlatform() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [checkInterval, setCheckInterval] = useState("")

  const {user} = useUser()

  const handleAddWebsite = () => {
    // Handle form submission here
    console.log("Adding website:", { websiteUrl, checkInterval })
    setIsDialogOpen(false)
    setWebsiteUrl("")
    setCheckInterval("")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {user?.email ? (
      <>
      {/* Hero Section */}
      <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className={`text-7xl font-bold leading-tight ${anton.className}`}>
                HELLO {user?.name?.toLocaleUpperCase() || "User"}!
              </h1>
              <p className="text-gray-400 text-lg mt-4">
                Monitor your websites and get instant alerts when they go down
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search website URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-neutral-900 border-gray-700 text-white rounded-full placeholder-gray-400"
              />
            </div>
            <div className="flex items-center justify-center space-x-2" >
              <WalletConnectButton/>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-green-500 hover:bg-green-600 text-black font-medium flex items-center gap-2 px-6 py-2">
                    <Plus className="h-4 w-4" />
                    Add Website
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-gray-700 text-white rounded-3xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">Add Sites</DialogTitle>
                    <p className="text-gray-400 text-sm mt-2">
                      Start monitoring your website's uptime and get instant notifications when it goes down. We'll
                      check your site at regular intervals and track its performance.
                    </p>
                  </DialogHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="website-url" className="text-sm font-medium text-gray-300">
                        Website URL
                      </Label>
                      <Input
                        id="website-url"
                        placeholder="https://example.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="bg-neutral-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-interval" className="text-sm font-medium text-gray-300">
                        Check Interval
                      </Label>
                      <Select value={checkInterval} onValueChange={setCheckInterval}>
                        <SelectTrigger className="bg-neutral-800 border-gray-600 text-white focus:border-green-500 rounded-xl">
                          <SelectValue placeholder="Select how often to check" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-gray-600 rounded-xl">
                          <SelectItem value="1min" className="text-white hover:bg-neutral-700">
                            Every 1 minute
                          </SelectItem>
                          <SelectItem value="5min" className="text-white hover:bg-neutral-700">
                            Every 5 minutes
                          </SelectItem>
                          <SelectItem value="15min" className="text-white hover:bg-neutral-700">
                            Every 15 minutes
                          </SelectItem>
                          <SelectItem value="30min" className="text-white hover:bg-neutral-700">
                            Every 30 minutes
                          </SelectItem>
                          <SelectItem value="1hour" className="text-white hover:bg-neutral-700">
                            Every 1 hour
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1 rounded-full border-gray-600 bg-transparent text-gray-300 hover:bg-neutral-800 hover:text-white hover:border-gray-500"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddWebsite}
                        disabled={!websiteUrl || !checkInterval}
                        className="flex-1 rounded-full bg-green-500 hover:bg-green-600 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Website
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800 bg-neutral-900">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
                <div className="col-span-1">#</div>
                <div className="col-span-4">URLs</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Last Checked</div>
                <div className="col-span-2 text-right">Uptime</div>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {monitorData.map((item) => (
                <Link key={item.rank} href={`/${item.id}`}>
                  <div className="px-6 py-5 hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1 text-gray-300 font-medium">{item.rank}</div>

                      <div className="col-span-4 flex items-center space-x-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{item.url}</p>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Badge
                          className={`${
                            item.status === "Active"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          } border`}
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <div className="col-span-3">
                        <span className="text-gray-400 text-sm">{item.lastChecked}</span>
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="font-bold text-white text-lg">{item.uptime}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      ) : (
        <div className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className={`text-7xl font-bold leading-tight ${anton.className} uppercase`}>
                Kindly Login to Proceed
              </h1>
              <p className="text-gray-400 text-lg mt-4">
                Monitor your websites and get instant alerts when they go down
              </p>
            </div>
          </div>
        </div>
      </div>
      )
      
      }

    </div>
  )
}
