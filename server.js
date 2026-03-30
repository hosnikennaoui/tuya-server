const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

// بيانات Tuya
const CLIENT_ID = "erh4dc4f9rmng3na33sa";
const SECRET = "ec514032c3fe4842918515971409ca38";
const DEVICE_ID = "bf6603208b35a92f65eanl";

let lastData = {
  temp: 0,
  humidity: 0
};

// دالة إنشاء التوقيع
function sign(t) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(CLIENT_ID + t)
    .digest("hex")
    .toUpperCase();
}

// جلب البيانات من Tuya
async function getTuyaData() {
  const t = Date.now().toString();
  const s = sign(t);

  // 1. جلب token
  const tokenRes = await axios.get(
    "https://openapi.tuyaeu.com/v1.0/token?grant_type=1",
    {
      headers: {
        client_id: CLIENT_ID,
        sign: s,
        t: t,
        sign_method: "HMAC-SHA256"
      }
    }
  );

  const token = tokenRes.data.result.access_token;

  // 2. جلب بيانات الجهاز
  const deviceRes = await axios.get(
    https://openapi.tuyaeu.com/v1.0/devices/${DEVICE_ID}/status,
    {
      headers: {
        client_id: CLIENT_ID,
        access_token: token
      }
    }
  );

  let temp = 0;
  let humidity = 0;

  deviceRes.data.result.forEach(d => {
    if (d.code === "temp_current") temp = d.value / 10;
    if (d.code === "humidity_value") humidity = d.value / 10;
  });

  lastData = { temp, humidity };
}

// تحديث كل 10 ثواني
setInterval(() => {
  getTuyaData().catch(err => console.log(err.message));
}, 10000);

// endpoint للـ ESP
app.get("/data", (req, res) => {
  res.json(lastData);
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
