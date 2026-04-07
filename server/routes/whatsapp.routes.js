const express = require("express");
const router = express.Router();
const { verify, handleMessage } = require("../contollers/whatsapp.controller");

router.get("/", verify);
router.post("/", handleMessage);

module.exports = router;
