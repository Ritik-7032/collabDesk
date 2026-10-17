import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 20 }, // Ramp-up to 20 virtual users
    { duration: "30s", target: 50 }, // Sustained load at 50 virtual users
    { duration: "10s", target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<50", "p(99)<100"], // 95% < 50ms, 99% < 100ms
    http_req_failed: ["rate<0.01"],               // Error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:5000";

export default function () {
  // 1. Health check & latency tracking
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "has response time header": (r) => r.headers["X-Response-Time"] !== undefined,
  });

  sleep(0.1);
}
