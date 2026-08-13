import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

// Slug of the organization "Pro" plan configured in Clerk Billing. Kept here so
// every gate reads from one place — change it if the plan is renamed.
const PRO_PLAN = "pro"

// Where the pricing table lives inside the dashboard layout.
const BILLING_PATH = "/billing"

export type ProPlan = {
  // Whether Clerk has hydrated the session — `isPro` is not meaningful until this
  // is true, so components should treat `false` as "still loading", not "not pro".
  isLoaded: boolean
  // True when the active organization is subscribed to the Pro plan. Reflects the
  // active entity, so it follows the org the user currently has selected.
  isPro: boolean
  // Send the user to the pricing page to subscribe / upgrade.
  goToUpgrade: () => void
}

// Tells a component whether the active organization is on Pro, and hands it a
// callback to route the user to the pricing page to upgrade. Use to gate UI
// behind the Pro plan (e.g. show an "Upgrade" prompt instead of a pro-only node).
export function useProPlan(): ProPlan {
  const { has, isLoaded } = useAuth()
  const router = useRouter()

  const goToUpgrade = useCallback(() => {
    router.push(BILLING_PATH)
  }, [router])

  // `has` is undefined until the session loads; optional-chain and default to
  // false so callers never treat "unknown" as "subscribed".
  const isPro = has?.({ plan: PRO_PLAN }) ?? false

  return { isLoaded, isPro, goToUpgrade }
}