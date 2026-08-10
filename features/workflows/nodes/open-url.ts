import type { Stagehand } from "@browserbasehq/stagehand"

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const page = stagehand.context.pages()[0]
  await page.goto(url, { waitUntil: "load", timeoutMs: 30_000 })

  return { url: page.url(), title: await page.title() }
}