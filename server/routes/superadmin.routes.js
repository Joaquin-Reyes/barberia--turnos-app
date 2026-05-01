const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { listarBarberias, crearBarberia, actualizarBarberia } = require("../contollers/superadmin.controller");

function validarSuperadmin(req, res, next) {
  if (req.user?.rol !== "superadmin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}

router.use(authMiddleware, validarSuperadmin);

router.get("/barberias", listarBarberias);
router.post("/crear-barberia", crearBarberia);
router.patch("/barberias/:id", actualizarBarberia);

module.exports = router;
