import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ??
    "https://73254540404752523a0e839fd902ad6c@o4511036431663104.ingest.us.sentry.io/4511903935692800",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,
})