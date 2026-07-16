"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"

export default function Page() {
  return (
    <div>
      <UserButton />
      <OrganizationSwitcher />
    </div>
  )
}
