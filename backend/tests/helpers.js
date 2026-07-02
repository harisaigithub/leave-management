const bcrypt = require("bcryptjs");
const db = require("../src/db");

/**
 * Wipes both tables and inserts two fixed test users. Called from
 * beforeAll/beforeEach in each suite so tests don't leak state into
 * one another. Uses a low bcrypt cost factor purely to keep the test
 * suite fast - never do this in production seeding.
 */
function resetAndSeed() {
  db.exec("DELETE FROM leaves");
  db.exec("DELETE FROM employees");
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('leaves','employees')");

  const insert = db.prepare(`
    INSERT INTO employees (name, email, password, department, role)
    VALUES (@name, @email, @password, @department, @role)
  `);
  const hash = (pw) => bcrypt.hashSync(pw, 4);

  insert.run({ name: "Test Manager", email: "manager@test.com", password: hash("Manager@123"), department: "Engineering", role: "MANAGER" });
  insert.run({ name: "Test Employee", email: "employee@test.com", password: hash("Employee@123"), department: "Engineering", role: "EMPLOYEE" });
  insert.run({ name: "Other Employee", email: "other@test.com", password: hash("Employee@123"), department: "Design", role: "EMPLOYEE" });
}

module.exports = { resetAndSeed, db };
