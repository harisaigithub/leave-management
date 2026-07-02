const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Leave Management API running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});
