const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

const CLIENT_ID = "erh4dc4f9rmng3na33sa";
const SECRET = "ec514032c3fe4842918515971409ca38";
const DEVICE_ID = "bf6603208b35a92f65eanl";

const BASE_URL = "https://openapi.tuyaeu.com";

let lastData = { temp: 0, humidity: 0 };

// ✅ توقيع بسيط (الذي يعمل مع أغلب الحسابات)
function createSign(t) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(CLIENT_ID + t)
    .digest("hex")
    .toUpperCase();
}

// ✅ جلب التوكن
async function getToken() {
  const t = Date.now().toString();

  try {
    const res = await axios.get(`${BASE_URL}/v1.0/token?grant_type=1`, {
      headers: {
        client_id: CLIENT_ID,
        sign: createSign(t),
        t: t,
        sign_method: "HMAC-SHA256"
      }
    });

    console.log("TOKEN:", res.data);

    if (!res.data.success) {
      throw new Error(JSON.stringify(res.data));
    }

    return res.data.result.access_token;

  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    return null;
  }
}

// ✅ جلب البيانات
async function getData() {
  try {
    const token = await getToken();
    if (!token) return;

    const res = await axios.get(
      `${BASE_URL}/v1.0/devices/${DEVICE_ID}/status`,
      {
        headers: {
          client_id: CLIENT_ID,
          access_token: token
        }
      }
    );

    console.log("DATA:", res.data);

    let temp = 0;
    let humidity = 0;

    res.data.result.forEach(d => {
      if (d.code === "temp_current") temp = d.value / 10;
      if (d.code === "humidity_value") humidity = d.value / 10;
    });

    lastData = { temp, humidity };

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
  }
}

// تحديث كل 10 ثواني
setInterval(getData, 10000);

// API
app.get("/data", (req, res) => {
  res.json(lastData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
