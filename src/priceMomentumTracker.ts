export type PriceDirection = "UP" | "DOWN" | "FLAT"

interface PricePoint {
  price: number
  timestamp: number
}

export interface PriceMomentumSnapshot {
  price: number | null
  fresh: boolean
  changePct: number | null
  speedPctPerSec: number | null
  direction: PriceDirection
  maxDrawdownPct: number | null
  points: number
}

export class PriceMomentumTracker {
  private history: PricePoint[] = []
  private readonly WINDOW_MS = 30_000   // 30s de mémoire
  private readonly FRESH_MS = 6_000     // données récentes

  add(priceUsd: number) {
    const now = Date.now()

    this.history.push({ price: priceUsd, timestamp: now })

    // garder uniquement la fenêtre utile
    const cutoff = now - this.WINDOW_MS
    this.history = this.history.filter(p => p.timestamp >= cutoff)
  }

  snapshot(): PriceMomentumSnapshot {
    if (this.history.length < 2) {
      return {
        price: this.history.at(-1)?.price ?? null,
        fresh: false,
        changePct: null,
        speedPctPerSec: null,
        direction: "FLAT",
        maxDrawdownPct: null,
        points: this.history.length
      }
    }

    const first = this.history[0]
    const last = this.history[this.history.length - 1]

    const price = last.price
    const fresh = Date.now() - last.timestamp <= this.FRESH_MS

    const changePct =
      ((last.price - first.price) / first.price) * 100

    const durationSec =
      (last.timestamp - first.timestamp) / 1000

    const speedPctPerSec =
      durationSec > 0 ? changePct / durationSec : null

    let direction: PriceDirection = "FLAT"
    if (changePct > 0.2) direction = "UP"
    else if (changePct < -0.2) direction = "DOWN"

    // 📉 max drawdown
    let peak = first.price
    let maxDrawdownPct = 0

    for (const p of this.history) {
      if (p.price > peak) peak = p.price
      const drawdown = ((peak - p.price) / peak) * 100
      if (drawdown > maxDrawdownPct) {
        maxDrawdownPct = drawdown
      }
    }

    return {
      price,
      fresh,
      changePct,
      speedPctPerSec,
      direction,
      maxDrawdownPct,
      points: this.history.length
    }
  }
}
