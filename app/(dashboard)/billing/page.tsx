import { PricingTable } from "@clerk/nextjs"

export default function BillingPage() {
  return (
    <div className="h-svh overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Choose a plan for your organization. Upgrades and checkout happen
            right here.
          </p>
        </div>
        <PricingTable
          for="organization"
          newSubscriptionRedirectUrl="/billing"
        />
      </div>
    </div>
  )
}