const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

// 🔴 عوّض هذه القيم من Tuya
const CLIENT_ID = "erh4dc4f9rmng3na33sa";
const SECRET = "ec514032c3fe4842918515971409ca38";
const DEVICE_ID = "bf6603208b35a92f65eanl";



// ✅ Data Center ديالك (Europe)
const BASE_URL = "https://openapi.tuyaeu-central.com";

let lastData = { temp: 0, humidity: 0 };

// ✅ إنشاء التوقيع
function sign(str) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(str)
    .digest("hex")
    .toUpperCase();
}

// ✅ جلب التوكن
async function getToken() {
  try {
    const t = Date.now().toString();
    const signStr = CLIENT_ID + t;

    const response = await axios.get(
      `${BASE_URL}/v1.0/token?grant_type=1`,
      {
        headers: {
          client_id: CLIENT_ID,
          sign: sign(signStr),
          t: t,
          sign_method: "HMAC-SHA256"
        }
      }
    );

    console.log("TOKEN RESPONSE FULL:", response.data); // 🔥 مهم

    if (!response.data.success) {
      throw new Error("Tuya Error: " + JSON.stringify(response.data));
    }

    return response.data.result.access_token;

  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    throw err;
  }
}

// ✅ جلب بيانات الجهاز
async function getData() {
  try {
    const token = await getToken();

    const response = await axios.get(
      `${BASE_URL}/v1.0/devices/${DEVICE_ID}/status`,
      {
        headers: {
          client_id: CLIENT_ID,
          access_token: token,
          sign_method: "HMAC-SHA256"
        }
      }
    );

console.log("FULL DATA:", JSON.stringify(response.data, null, 2));

    lastData = { temp, humidity };
    console.log("✅ Data updated:", lastData);

  } catch (error) {
    console.log("❌ ERROR:", error.response?.data || error.message);
  }
}

// ✅ تحديث كل 10 ثواني
setInterval(getData, 10000);

// ✅ API endpoint
app.get("/data", (req, res) => {
  res.json(lastData);
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

// ✅ منع الكراش
process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED:", err);
});
