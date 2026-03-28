const express = require("express");
const app = express();

// بيانات مؤقتة (سنربط Tuya لاحقًا)
let data = {
  temp: 25,
  humidity: 60,
  relay: 0
};

// رابط يقرأ منه ESP
app.get("/data", (req, res) => {
  res.json(data);
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running");
});
