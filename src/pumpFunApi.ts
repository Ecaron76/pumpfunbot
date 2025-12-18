import fetch from "node-fetch"

const MORALIS_ENDPOINT = "https://solana-gateway.moralis.io"
const MORALIS_API_KEY = process.env.MORALIS_API_KEY!

if (!MORALIS_API_KEY) {
  throw new Error("Missing MORALIS_API_KEY in .env")
}

export interface PumpFunPrice {
  usdPrice: number
  nativePriceSol: number
  exchange: string
}

/**
 * Fetch Pump.fun token price from Moralis
 */
export async function fetchPumpFunPrice(
  mint: string
): Promise<PumpFunPrice | null> {
  try {
    const res = await fetch(
      `https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/bonding?limit=10`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": MORALIS_API_KEY
        }
      }
    )

    if (!res.ok) {
      console.error("Moralis HTTP error", res.status)
      return null
    }

    const json: any = await res.json()
    console.log(json)
    if (!json?.usdPrice || !json?.nativePrice?.value) {
      return null
    }

    return {
      usdPrice: Number(json.usdPrice),
      nativePriceSol:
        Number(json.nativePrice.value) /
        10 ** json.nativePrice.decimals,
      exchange: json.exchangeName
    }
  } catch (e) {
    console.error("Moralis fetch error", e)
    return null
  }
}
