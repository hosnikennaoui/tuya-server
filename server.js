const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

const CLIENT_ID = "erh4dc4f9rmng3na33sa";
const SECRET = "ec514032c3fe4842918515971409ca38";
const DEVICE_ID = "bf6603208b35a92f65eanl";

const BASE_URL = "https://openapi.tuyaeu.com";

let lastData = { temp: 0, humidity: 0 };

function sign(str) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(str)
    .digest("hex")
    .toUpperCase();
}

// ✅ TOKEN
async function getToken() {
  try {
    const t = Date.now().toString();
    const method = "GET";
    const path = "/v1.0/token?grant_type=1";

    const stringToSign = method + "\n" + "\n" + "\n" + path;
    const signStr = CLIENT_ID + t + stringToSign;

    const signature = sign(signStr);

    const response = await axios.get(
      `${BASE_URL}${path}`,
      {
        headers: {
          client_id: CLIENT_ID,
          sign: signature,
          t: t,
          sign_method: "HMAC-SHA256"
        }
      }
    );

    console.log("TOKEN RESPONSE:", response.data);

    if (!response.data.success) {
      throw new Error(JSON.stringify(response.data));
    }

    return response.data.result.access_token;

  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    throw err;
  }
}

// ✅ DATA
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

    let temp = 0;
    let humidity = 0;

    response.data.result.forEach(item => {
      if (item.code === "temp_current") temp = item.value / 10;
      if (item.code === "humidity_value") humidity = item.value / 10;
    });

    lastData = { temp, humidity };
    console.log("✅ Data updated:", lastData);

  } catch (error) {
    console.log("❌ ERROR:", error.response?.data || error.message);
  }
}

setInterval(getData, 10000);

app.get("/data", (req, res) => {
  res.json(lastData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED:", err);
});
