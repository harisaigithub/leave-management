const request = require("supertest");
const app = require("../src/app");
const { resetAndSeed } = require("./helpers");

let empToken, mgrToken, leaveId;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(async () => {
  resetAndSeed();
  empToken = (await request(app).post("/api/auth/login").send({ email: "employee@test.com", password: "Employee@123" })).body.token;
  mgrToken = (await request(app).post("/api/auth/login").send({ email: "manager@test.com", password: "Manager@123" })).body.token;

  const applyRes = await request(app)
    .post("/api/leaves")
    .set(auth(empToken))
    .send({ leave_type: "EARNED", start_date: "2026-09-01", end_date: "2026-09-03", reason: "Vacation planning" });
  leaveId = applyRes.body.leave.leave_id;
});

describe("Role-based access control", () => {
  test("an employee gets 403 on manager-only routes", async () => {
    const res = await request(app).get("/api/manager/pending-leaves").set(auth(empToken));
    expect(res.status).toBe(403);
  });
});

describe("GET /api/manager/pending-leaves", () => {
  test("returns pending requests joined with employee info", async () => {
    const res = await request(app).get("/api/manager/pending-leaves").set(auth(mgrToken));
    expect(res.status).toBe(200);
    expect(res.body.leaves.length).toBeGreaterThanOrEqual(1);
    expect(res.body.leaves[0]).toHaveProperty("employee_name");
  });
});

describe("PUT /api/manager/leaves/:id/reject", () => {
  test("requires a comment, returns 400 when missing", async () => {
    const res = await request(app).put(`/api/manager/leaves/${leaveId}/reject`).set(auth(mgrToken)).send({});
    expect(res.status).toBe(400);
  });

  test("rejects successfully with a comment", async () => {
    const res = await request(app).put(`/api/manager/leaves/${leaveId}/reject`).set(auth(mgrToken)).send({ manager_comments: "Not enough coverage that week" });
    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe("REJECTED");
  });
});

describe("PUT /api/manager/leaves/:id/approve", () => {
  test("approves a PENDING leave", async () => {
    const res = await request(app).put(`/api/manager/leaves/${leaveId}/approve`).set(auth(mgrToken)).send({ manager_comments: "Enjoy!" });
    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe("APPROVED");
  });

  test("cannot approve a leave twice (409 on second attempt)", async () => {
    await request(app).put(`/api/manager/leaves/${leaveId}/approve`).set(auth(mgrToken)).send({});
    const res = await request(app).put(`/api/manager/leaves/${leaveId}/approve`).set(auth(mgrToken)).send({});
    expect(res.status).toBe(409);
  });
});

describe("GET /api/manager/dashboard", () => {
  test("returns org-wide totals", async () => {
    const res = await request(app).get("/api/manager/dashboard").set(auth(mgrToken));
    expect(res.status).toBe(200);
    expect(res.body.totals).toHaveProperty("totalEmployees");
    expect(res.body.totals).toHaveProperty("pendingApprovals");
  });
});
