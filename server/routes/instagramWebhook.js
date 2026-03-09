const express = require("express");
const router = express.Router();

const VERIFY_TOKEN = "gormaran_verify_token";

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Instagram webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/", (req, res) => {
  console.log("Instagram webhook event:", req.body);
  res.status(200).send("EVENT_RECEIVED");
});

module.exports = router;