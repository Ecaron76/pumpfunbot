import "dotenv/config"
import { Connection } from "@solana/web3.js"

import { listenPumpCreates } from "./pumpCreateListener"
import { fetchPumpSnapshot } from "./moralisPump"
import { PriceMomentumTracker } from "./priceMomentumTracker"
import { TokenRegistry } from "./tokenRegistry"

const registry = new TokenRegistry(20, 120_000)
if (!process.env.RPC) {
  throw new Error("RPC missing in .env")
}

const connection = new Connection(process.env.RPC, "confirmed")

console.log("🚀 Pump.fun bot – CREATE + MORALIS PRICE + VOLUME")

// trackers par mint
const intervals = new Map<string, NodeJS.Timeout>()

export async function onNewPumpMint(mint: string) {
  // 🚫 refuser si registry plein
  const accepted = registry.add(mint)
  if (!accepted) return

  console.log("🆕 NEW PUMP MINT", mint)

  setInterval(async () => {
    const snap = await fetchPumpSnapshot(mint)
    registry.update(mint)

    console.log("📊 SNAPSHOT", snap)
  }, 5_000)
}


// 🔥 start listener
listenPumpCreates(connection)
