const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

module.exports.before = function(app) {
  Sentry.init({
    dsn: "https://d7d60b44edde4e8cab2ce181ebffe71e@o1102170.ingest.sentry.io/6128352",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  })

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler())
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler())

  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!")
  })
}

module.exports.after = function(app) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler())

  // Optional fallthrough error handler
  app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500
    res.end("Fatal error (" + res.sentry + ")\nPlease report this error in Silex forums if it persists: https://github.com/silexlabs/Silex/issues\n")
  })
}
