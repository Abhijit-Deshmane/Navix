import Link from "next/link"
import { SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <Empty className="min-h-svh border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Workflow not found</EmptyTitle>
        <EmptyDescription>
          The workflow you&apos;re looking for doesn&apos;t exist or may have
          been deleted.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/">Back to workflows</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}