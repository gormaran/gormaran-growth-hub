import express from "express";

const router = express.Router();

const VERIFY_TOKEN = "gormaran_verify_token";

router.get("/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/instagram", (req, res) => {
  console.log("Instagram webhook event:", req.body);
  res.status(200).send("EVENT_RECEIVED");
});

export default router;