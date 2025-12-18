export type TokenState = {
  mint: string
  createdAt: number
  lastUpdate: number
  status: "NEW" | "TRACKING" | "REJECTED" | "CANDIDATE"
}

export class TokenRegistry {
  private tokens = new Map<string, TokenState>()

  constructor(
    private readonly maxTokens = 20,
    private readonly ttlMs = 2 * 60_000 // 2 minutes
  ) {}

  add(mint: string): boolean {
    if (this.tokens.has(mint)) return false

    // 🔒 limite globale
    if (this.tokens.size >= this.maxTokens) {
      console.log("⛔ registry full, skip", mint)
      return false
    }

    const now = Date.now()

    this.tokens.set(mint, {
      mint,
      createdAt: now,
      lastUpdate: now,
      status: "NEW"
    })

    console.log("📥 registry add", mint)
    return true
  }

  update(mint: string) {
    const t = this.tokens.get(mint)
    if (!t) return
    t.lastUpdate = Date.now()
  }

  setStatus(mint: string, status: TokenState["status"]) {
    const t = this.tokens.get(mint)
    if (!t) return
    t.status = status
  }

  remove(mint: string, reason?: string) {
    if (this.tokens.delete(mint)) {
      console.log("🗑️ registry remove", mint, reason ?? "")
    }
  }

  get(mint: string): TokenState | undefined {
    return this.tokens.get(mint)
  }

  getAll(): TokenState[] {
    return [...this.tokens.values()]
  }

  cleanup() {
    const now = Date.now()

    for (const [mint, t] of this.tokens.entries()) {
      if (now - t.createdAt > this.ttlMs) {
        this.remove(mint, "TTL expired")
      }
    }
  }
}
