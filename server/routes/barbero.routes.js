const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getTurnosBarbero } = require("../contollers/barbero.controller");

router.get("/turnos", authMiddleware, getTurnosBarbero);

module.exports = router;
