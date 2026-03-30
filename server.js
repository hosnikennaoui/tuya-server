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

async function getToken() {
  const t = Date.now().toString();
  const signStr = CLIENT_ID + t;

  const res = await axios.get(`${BASE_URL}/v1.0/token?grant_type=1`, {
    headers: {
      client_id: CLIENT_ID,
      sign: sign(signStr),
      t: t,
      sign_method: "HMAC-SHA256"
    }
  });

  return res.data.result.access_token;
}

async function getData() {
  try {
    const token = await getToken();

    const res = await axios.get(${BASE_URL}/v1.0/devices/${DEVICE_ID}/status, {
      headers: {
        client_id: CLIENT_ID,
        access_token: token
      }
    });

    let temp = 0;
    let humidity = 0;

    res.data.result.forEach(d => {
      if (d.code === "temp_current") temp = d.value / 10;
      if (d.code === "humidity_value") humidity = d.value / 10;
    });

    lastData = { temp, humidity };
    console.log("Updated:", lastData);

  } catch (err) {
    console.log("ERROR:", err.message);
  }
}

setInterval(getData, 10000);

app.get("/data", (req, res) => {
  res.json(lastData);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
