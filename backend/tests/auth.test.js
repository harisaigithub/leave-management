const request = require("supertest");
const app = require("../src/app");
const { resetAndSeed } = require("./helpers");

beforeEach(() => resetAndSeed());

describe("POST /api/auth/login", () => {
  test("logs in with valid credentials and returns a JWT + user profile", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "employee@test.com", password: "Employee@123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("employee@test.com");
    expect(res.body.user.password).toBeUndefined(); // never leak the hash
  });

  test("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@test.com", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("InvalidCredentials");
  });

  test("rejects a wrong password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "employee@test.com", password: "WrongPass1" });
    expect(res.status).toBe(401);
  });

  test("rejects a malformed email with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(400);
  });
});

describe("Protected routes without a token", () => {
  test("GET /api/leaves returns 401 with no Authorization header", async () => {
    const res = await request(app).get("/api/leaves");
    expect(res.status).toBe(401);
  });
});
