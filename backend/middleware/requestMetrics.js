/**
 * High-resolution HTTP latency and structured request metrics middleware.
 * Attaches X-Response-Time header to all outgoing responses.
 */
const requestMetrics = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const formattedDuration = `${durationMs.toFixed(2)}ms`;

    // Try setting header if headers not yet sent (safety fallback)
    if (!res.headersSent) {
      res.setHeader("X-Response-Time", formattedDuration);
    }

    // Suppress console logs in automated testing environments
    if (process.env.NODE_ENV !== "test") {
      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;

      if (durationMs > 500) {
        console.warn(`[PERF WARNING] ${method} ${url} ${status} - ${formattedDuration} (slow response)`);
      } else {
        console.log(`[HTTP] ${method} ${url} ${status} - ${formattedDuration}`);
      }
    }
  });

  // Calculate and set header before response stream writes
  const originalEnd = res.end;
  res.end = function (...args) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);
    return originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestMetrics;
