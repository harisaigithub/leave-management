const request = require("supertest");
const app = require("../src/app");
const { resetAndSeed } = require("./helpers");

let empToken, otherToken;

beforeEach(async () => {
  resetAndSeed();
  empToken = (await request(app).post("/api/auth/login").send({ email: "employee@test.com", password: "Employee@123" })).body.token;
  otherToken = (await request(app).post("/api/auth/login").send({ email: "other@test.com", password: "Employee@123" })).body.token;
});

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("POST /api/leaves", () => {
  test("creates a PENDING leave request for the authenticated employee", async () => {
    const res = await request(app)
      .post("/api/leaves")
      .set(auth(empToken))
      .send({ leave_type: "CASUAL", start_date: "2026-08-01", end_date: "2026-08-02", reason: "Family event" });
    expect(res.status).toBe(201);
    expect(res.body.leave.status).toBe("PENDING");
  });

  test("rejects start_date after end_date with 400", async () => {
    const res = await request(app)
      .post("/api/leaves")
      .set(auth(empToken))
      .send({ leave_type: "CASUAL", start_date: "2026-08-05", end_date: "2026-08-01", reason: "Bad dates" });
    expect(res.status).toBe(400);
  });

  test("rejects a reason under 5 characters", async () => {
    const res = await request(app)
      .post("/api/leaves")
      .set(auth(empToken))
      .send({ leave_type: "CASUAL", start_date: "2026-08-01", end_date: "2026-08-02", reason: "Hi" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/leaves", () => {
  test("only returns the caller's own leave requests", async () => {
    await request(app).post("/api/leaves").set(auth(empToken)).send({ leave_type: "SICK", start_date: "2026-08-01", end_date: "2026-08-01", reason: "Flu symptoms" });
    await request(app).post("/api/leaves").set(auth(otherToken)).send({ leave_type: "SICK", start_date: "2026-08-01", end_date: "2026-08-01", reason: "Other person's leave" });

    const res = await request(app).get("/api/leaves").set(auth(empToken));
    expect(res.status).toBe(200);
    expect(res.body.leaves).toHaveLength(1);
    expect(res.body.leaves[0].reason).toBe("Flu symptoms");
  });

  test("filters by status", async () => {
    await request(app).post("/api/leaves").set(auth(empToken)).send({ leave_type: "SICK", start_date: "2026-08-01", end_date: "2026-08-01", reason: "Flu symptoms" });
    const res = await request(app).get("/api/leaves?status=REJECTED").set(auth(empToken));
    expect(res.status).toBe(200);
    expect(res.body.leaves).toHaveLength(0);
  });
});

describe("PUT /api/leaves/:id and DELETE /api/leaves/:id", () => {
  async function createLeave(token) {
    const res = await request(app)
      .post("/api/leaves")
      .set(auth(token))
      .send({ leave_type: "CASUAL", start_date: "2026-08-01", end_date: "2026-08-02", reason: "Original reason" });
    return res.body.leave.leave_id;
  }

  test("owner can edit a PENDING leave", async () => {
    const id = await createLeave(empToken);
    const res = await request(app).put(`/api/leaves/${id}`).set(auth(empToken)).send({ reason: "Updated reason text" });
    expect(res.status).toBe(200);
    expect(res.body.leave.reason).toBe("Updated reason text");
  });

  test("non-owner cannot edit another employee's leave (403)", async () => {
    const id = await createLeave(empToken);
    const res = await request(app).put(`/api/leaves/${id}`).set(auth(otherToken)).send({ reason: "Hijacked reason" });
    expect(res.status).toBe(403);
  });

  test("owner can cancel a PENDING leave, status becomes CANCELLED", async () => {
    const id = await createLeave(empToken);
    const res = await request(app).delete(`/api/leaves/${id}`).set(auth(empToken));
    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe("CANCELLED");
  });

  test("cannot edit a leave that is no longer PENDING", async () => {
    const id = await createLeave(empToken);
    await request(app).delete(`/api/leaves/${id}`).set(auth(empToken)); // now CANCELLED
    const res = await request(app).put(`/api/leaves/${id}`).set(auth(empToken)).send({ reason: "Too late to edit" });
    expect(res.status).toBe(409);
  });
});
