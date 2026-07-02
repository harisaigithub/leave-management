const bcrypt = require("bcryptjs");
const db = require("./index");

function seed() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM employees").get();
  if (existing.count > 0) {
    console.log("Seed skipped: employees table already has data.");
    return;
  }

  const insert = db.prepare(`
    INSERT INTO employees (name, email, password, department, role)
    VALUES (@name, @email, @password, @department, @role)
  `);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const users = [
    { name: "Alice Manager", email: "manager@demo.com", password: hash("Manager@123"), department: "Engineering", role: "MANAGER" },
    { name: "Bob Employee", email: "employee@demo.com", password: hash("Employee@123"), department: "Engineering", role: "EMPLOYEE" },
    { name: "Carol Employee", email: "carol@demo.com", password: hash("Employee@123"), department: "Design", role: "EMPLOYEE" },
  ];

  db.exec("BEGIN");
  try {
    for (const row of users) insert.run(row);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  console.log("Seed complete. Sample credentials:");
  console.table(users.map(({ name, email, role }) => ({ name, email, role, password: "see seed.js" })));
  console.log("manager@demo.com / Manager@123");
  console.log("employee@demo.com / Employee@123");
}

seed();
