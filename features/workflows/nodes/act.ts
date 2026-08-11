import type { Stagehand } from "@browserbasehq/stagehand"

export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const result = await stagehand.act(instruction)
  const page = stagehand.context.pages()[0]

  return { success: result.success, message: result.message, url: page.url() }
}