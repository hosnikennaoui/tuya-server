const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const app = express();

const CLIENT_ID = "r4hjagvhk9wpq5dsauaj";
const SECRET = "651e698edf174a28b93e2f0a337c3a17";
const DEVICE_ID = "bf6603208b35a92f65eanl";
const BASE_URL = "https://openapi.tuyaeu.com";

let lastData = { temp: 0, humidity: 0, time: "" };

function createSign(str) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(str)
    .digest("hex")
    .toUpperCase();
}

async function getToken() {
  const t = Date.now().toString();
  const method = "GET";
  const path = "/v1.0/token?grant_type=1";
  const stringToSign = method + "\n\n\n" + path;
  const signStr = CLIENT_ID + t + stringToSign;
  const sign = createSign(signStr);

  const response = await axios.get(${BASE_URL}${path}, {
    headers: {
      client_id: CLIENT_ID,
      sign: sign,
      t: t,
      sign_method: "HMAC-SHA256"
    }
  });

  if (!response.data.success) {
    throw new Error("Token failed: " + JSON.stringify(response.data));
  }
  return response.data.result.access_token;
}

async function getData() {
  try {
    const token = await getToken();
    const t = Date.now().toString();
    const method = "GET";
    const path = /v1.0/devices/${DEVICE_ID}/status;
    const stringToSign = method + "\n\n\n" + path;
    const signStr = CLIENT_ID + token + t + stringToSign;
    const sign = createSign(signStr);

    const response = await axios.get(${BASE_URL}${path}, {
      headers: {
        client_id: CLIENT_ID,
        access_token: token,
        sign: sign,
        t: t,
        sign_method: "HMAC-SHA256"
      }
    });

    console.log("📦 Data:", JSON.stringify(response.data));

    let temp = 0, humidity = 0;
    response.data.result.forEach(item => {
      if (item.code === "va_temperature") temp = item.value / 10;
      if (item.code === "va_humidity")    humidity = item.value / 10;
      if (item.code === "temp_current")   temp = item.value / 10;
      if (item.code === "humidity_value") humidity = item.value / 10;
    });

    lastData = { 
      temp, 
      humidity, 
      time: new Date().toISOString() 
    };
    console.log("✅ Updated:", lastData);

  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
}

// تحديث كل 15 ثانية
setInterval(getData, 15000);
getData();

app.get("/data", (req, res) => {
  res.json(lastData);
});

app.get("/", (req, res) => {
  res.json({ status: "running", data: lastData });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED:", err);
});
