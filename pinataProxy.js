const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const PINATA_JWT = process.env.PINATA_JWT;

app.post("/pinJSONToIPFS", async (req, res) => {
  try {
    const metadata = req.body;
    if (!metadata) return res.status(400).json({ error: "Missing JSON body" });

    const pinataRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          Authorization: PINATA_JWT,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(pinataRes.data);
  } catch (err) {
    console.error("Pinata upload error:", err.message || err);
    res.status(500).json({ error: "Pinata upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Pinata proxy server running on port ${PORT}`);
});
