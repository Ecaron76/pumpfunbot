import fetch from "node-fetch"

const MORALIS_BASE = "https://solana-gateway.moralis.io"
const API_KEY = process.env.MORALIS_API_KEY!

if (!API_KEY) {
  throw new Error("MORALIS_API_KEY missing in .env")
}

export interface PumpSnapshot {
  mint: string
  priceUsd: number | null
  bondingProgress: number | null
  timestamp: number
}

async function moralisGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": API_KEY
      }
    })

    if (!res.ok) {
      console.error("Moralis HTTP error", res.status)
      return null
    }

    return (await res.json()) as T
  } catch (e) {
    console.error("Moralis fetch error", e)
    return null
  }
}

export async function fetchPumpSnapshot(
  mint: string
): Promise<PumpSnapshot> {
  const [priceRes, bondRes] = await Promise.all([
    moralisGet<{ usdPrice: number }>(
      `${MORALIS_BASE}/token/mainnet/${mint}/price`
    ),
    moralisGet<{ bondingProgress: number }>(
      `${MORALIS_BASE}/token/mainnet/${mint}/bonding-status`
    )
  ])

  return {
    mint,
    priceUsd: priceRes?.usdPrice ?? null,
    bondingProgress: bondRes?.bondingProgress ?? null,
    timestamp: Date.now()
  }
}
