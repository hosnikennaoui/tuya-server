
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

// 🔴 ضع القيم الخاصة بك (من نفس المشروع)
const CLIENT_ID = "erh4dc4f9rmng3na33sa";
const SECRET = "ec514032c3fe4842918515971409ca38";
const DEVICE_ID = "bf6603208b35a92f65eanl";

// ✅ أوروبا
const BASE_URL = "https://openapi.tuyaeu.com";

let lastData = { temp: 0, humidity: 0 };

// 🔐 دالة التوقيع
function createSign(str) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(str)
    .digest("hex")
    .toUpperCase();
}

// ✅ جلب التوكن (تصحيح كامل)
async function getToken() {
  try {
    const t = Date.now().toString();
    const method = "GET";
    const path = "/v1.0/token?grant_type=1";

    // 🔥 مهم جداً: 3 أسطر فارغة
    const stringToSign = method + "\n\n\n" + path;

    // 🔥 الصحيح
    const signStr = CLIENT_ID + t + stringToSign;

    const sign = createSign(signStr);

    const response = await axios.get(`${BASE_URL}${path}`, {
      headers: {
        client_id: CLIENT_ID,
        sign: sign,
        t: t,
        sign_method: "HMAC-SHA256"
      }
    });

    console.log("✅ TOKEN RESPONSE:", response.data);

    if (!response.data.success) {
      throw new Error(JSON.stringify(response.data));
    }

    return response.data.result.access_token;

  } catch (err) {
    console.log("❌ TOKEN ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ جلب بيانات الجهاز
async function getData() {
  try {
    const token = await getToken();

    const t = Date.now().toString();
    const method = "GET";
    const path = `/v1.0/devices/${DEVICE_ID}/status`;

    const stringToSign = method + "\n\n\n" + path;

    // 🔥 مهم: هنا نضيف token
    const signStr = CLIENT_ID + token + t + stringToSign;

    const sign = createSign(signStr);

    const response = await axios.get(`${BASE_URL}${path}`, {
      headers: {
        client_id: CLIENT_ID,
        access_token: token,
        sign: sign,
        t: t,
        sign_method: "HMAC-SHA256"
      }
    });

    console.log("📦 FULL DATA:", JSON.stringify(response.data, null, 2));

    let temp = 0;
    let humidity = 0;

    response.data.result.forEach(item => {
      if (item.code === "temp_current") temp = item.value / 10;
      if (item.code === "humidity_value") humidity = item.value / 10;
    });

    lastData = { temp, humidity };

    console.log("✅ Updated:", lastData);

  } catch (error) {
    console.log("❌ DATA ERROR:", error.response?.data || error.message);
  }
}

// 🔁 تحديث كل 10 ثواني
setInterval(getData, 20000);

// 🌐 API لعرض البيانات
app.get("/data", (req, res) => {
  res.json(lastData);
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

// ❌ منع الكراش
process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED:", err);
});



