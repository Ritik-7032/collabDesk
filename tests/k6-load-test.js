import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "5s", target: 10 },  // Ramp-up to 10 sprint members
    { duration: "20s", target: 20 }, // Peak concurrent team members
    { duration: "5s", target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<400", "p(99)<800"], // Real Atlas network RTT threshold
    http_req_failed: ["rate<0.01"],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:5000";
const WORKSPACE_ID = __ENV.WORKSPACE_ID;
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export function setup() {
  // If no token was passed, attempt test login to acquire token for DB load test
  if (!AUTH_TOKEN && __ENV.LOGIN_EMAIL && __ENV.LOGIN_PASSWORD) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: __ENV.LOGIN_EMAIL,
        password: __ENV.LOGIN_PASSWORD,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      return { token: body.token, workspaceId: WORKSPACE_ID };
    }
  }
  return { token: AUTH_TOKEN, workspaceId: WORKSPACE_ID };
}

export default function (data) {
  if (data.token && data.workspaceId) {
    // Scenario 1: Authenticated Database Workload (JWT + Workspace Access + Task Query)
    const res = http.get(`${BASE_URL}/api/tasks/workspace/${data.workspaceId}`, {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });

    check(res, {
      "status is 200": (r) => r.status === 200,
      "tasks array returned": (r) => Array.isArray(JSON.parse(r.body)),
      "has response time header": (r) => r.headers["X-Response-Time"] !== undefined,
    });
  } else {
    // Scenario 2: Gateway & Security Pipeline Baseline
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      "status is 200": (r) => r.status === 200,
      "has response time header": (r) => r.headers["X-Response-Time"] !== undefined,
    });
  }

  sleep(0.1);
}
