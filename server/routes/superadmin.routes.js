const express = require("express");
const router = express.Router();
const { crearBarberia } = require("../contollers/superadmin.controller");

router.post("/crear-barberia", crearBarberia);

module.exports = router;
