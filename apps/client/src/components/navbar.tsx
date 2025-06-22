"use client"

import { Button } from "@/components/ui/button"
import { UserButton, useUser } from "@civic/auth/react"
import axios from "axios"
import { useEffect, useState } from "react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"

export function Navbar() {

  const {user} = useUser()
  const [data, setData] = useState<any>(null)
  const { account, signAndSubmitTransaction, connected, connect } = useWallet()

  // Aptos SDK setup
  const CONTRACT_ADDRESS = "0xf6d55a9f9009d4792996341270ed8b0c94b3a909e8d7f784ba3d69be019963e4" // <-- REPLACE with your actual deployed contract address (only hex digits, no < or >)
  // Example: const CONTRACT_ADDRESS = "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
  const MODULE_NAME = "uptime_monitoring"
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }))

  const fetchCredits = async () => {
    if (user?.email) {
      try {
        const {data, status} = await axios.post('/api/credits', {
          email: user.email
        })
        if (status == 200) {
          setData(data)
        }
      } catch (error) {
        console.error("Error fetching credits:", error)
      }
    }
  }

  const incrementCredits = async () => {
    if (user?.email) {
      try {
        const {data, status} = await axios.post('/api/increment-credits', {
          email: user.email
        })
        if (status == 200) {
          setData(data)
        }
      } catch (error) {
        console.error("Error incrementing credits:", error)
      }
    }
  }

  const buyCredits = async () => {
    if (!connected) {
      await connect("Petra")
    }
    if (!account?.address) {
      alert("Wallet not connected")
      return
    }
    try {
      const amount = 1000000 // 1 APT in Octas, adjust as needed

      const transaction = {
        data: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::deposit`,
          typeArguments: [],
          functionArguments: [amount],
        },
      }

      // Optional: simulate before sending, but skip if it causes issues
      // try {
      //   await aptos.simulateTransaction({
      //     sender: account.address,
      //     data: transaction.data,
      //   })
      // } catch (simError) {
      //   console.error("Simulation failed:", simError)
      //   alert("Simulation failed. Please check contract, wallet balance, and arguments.")
      //   return
      // }

      const response = await signAndSubmitTransaction(transaction)
      // Wait for confirmation, but handle errors gracefully
      try {
        await aptos.waitForTransaction({ transactionHash: response.hash })
        await incrementCredits()
        await fetchCredits()
      } catch (waitErr) {
        console.warn("Transaction may not be confirmed yet:", waitErr)
      }
    } catch (err: any) {
      // Provide more helpful error feedback
      if (err?.message?.includes("Generic error")) {
        alert("Deposit failed. Please ensure:\n- Your contract is deployed and the deposit function is public/entry\n- You have enough APT for the transaction\n- The contract address and module name are correct\n- The deposit function signature matches (user: &signer, amount: u64)")
      } else {
        alert("Failed to deposit credits. Please try again.")
      }
      console.error("Smart contract deposit failed:", err)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchCredits()
    }
  }, [user])

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Statik Logo" className="w-8 h-8" />
            <span className="text-white font-bold text-lg">STATIK</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">

        {user?.email &&
        <>
        <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-2 rounded-full border border-gray-700">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium text-white">{(data && data.user && data.user.credits) ? `${data.user.credits}` : '0'} Credits</span>
        </div>
        <Button onClick={buyCredits} className="bg-green-500 hover:bg-green-600 rounded-full text-black font-medium">Buy Credits</Button>
        </>
        }

        <UserButton/>
      </div>
    </nav>
  )
}
