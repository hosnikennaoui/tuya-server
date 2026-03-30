const express = require("express");
const app = express();

app.get("/data", (req, res) => {
  res.json({
    temp: 22,
    humidity: 50
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
