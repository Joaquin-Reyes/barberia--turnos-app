const express = require("express");
const router = express.Router();
const { listarBarberias, crearBarberia } = require("../contollers/superadmin.controller");

function validarSuperadmin(req, res, next) {
  const secret = req.headers["x-superadmin-secret"];
  if (!secret || secret !== process.env.SUPERADMIN_SECRET) {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}

router.get("/barberias", validarSuperadmin, listarBarberias);
router.post("/crear-barberia", validarSuperadmin, crearBarberia);

module.exports = router;
