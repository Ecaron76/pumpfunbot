import { Connection, PublicKey, Logs } from "@solana/web3.js"
import { onNewPumpMint } from "./index"

const PUMPFUN_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
)

// anti-spam RPC
let lastCreateTs = 0
const CREATE_COOLDOWN_MS = 3_000

export function listenPumpCreates(connection: Connection) {
  console.log("👂 Listening for Pump.fun creates...")

  connection.onLogs(
    PUMPFUN_PROGRAM_ID,
    async (logInfo: Logs) => {
      try {
        const now = Date.now()
        if (now - lastCreateTs < CREATE_COOLDOWN_MS) return

        // 1️⃣ filtrer uniquement les creates
        const isCreate = logInfo.logs.some(l =>
          l.toLowerCase().includes("create")
        )
        if (!isCreate) return

        lastCreateTs = now

        // 2️⃣ parser la tx APRÈS un délai (anti 429)
        setTimeout(async () => {
          const tx = await connection.getParsedTransaction(
            logInfo.signature,
            {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0
            }
          )

          if (!tx?.meta) return

          // 3️⃣ mint = token créé
          const postToken = tx.meta.postTokenBalances?.[0]
          if (!postToken?.mint) return
          const mint = postToken.mint

          let bondingCurve: PublicKey | null = null

          for (const k of tx.transaction.message.accountKeys) {
            const acc = await connection.getAccountInfo(k.pubkey)
            if (acc?.owner.equals(PUMPFUN_PROGRAM_ID)) {
              bondingCurve = k.pubkey
              break
            }
          }

          if (!bondingCurve) return

          onNewPumpMint(mint)
        }, 800)
      } catch (e) {
        console.error("pumpCreateListener error", e)
      }
    },
    "processed"
  )
}
