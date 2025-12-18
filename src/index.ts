import "dotenv/config"
import { Connection } from "@solana/web3.js"
import { listenPumpCreates } from "./pumpCreateListener"
import { fetchPumpFunPrice } from "./pumpFunApi"

if (!process.env.RPC) {
  throw new Error("RPC missing in .env")
}

const connection = new Connection(process.env.RPC, "confirmed")

console.log("🚀 Pump.fun bot – CREATE + MORALIS PRICE")

export async function onNewPumpMint(mint: string) {
  console.log("🆕 NEW PUMP MINT", mint)

  // Moralis peut avoir un léger délai
  setTimeout(async () => {
    const price = await fetchPumpFunPrice(mint)

    if (!price) {
      console.log("⚠️ no Moralis price yet")
      return
    }

    console.log("💲 MORALIS PRICE", {
      usd: price.usdPrice,
      sol: price.nativePriceSol,
      dex: price.exchange
    })
  }, 3_000)
}

// 🔥 start listener
listenPumpCreates(connection)
