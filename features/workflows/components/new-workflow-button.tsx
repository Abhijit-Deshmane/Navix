"use client"

import { useTransition } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

export function NewWorkflowButton() {
  const [isPending, startTransition] = useTransition()

  const handleCreateWorkflow = () => {
    startTransition(async () => {
      await createWorkflowAction(generateSlug())
    })
  }

  return (
    <Button onClick={handleCreateWorkflow} disabled={isPending}>
      <PlusIcon />
      New workflow
    </Button>
  )
}