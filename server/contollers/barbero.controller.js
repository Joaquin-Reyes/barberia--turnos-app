const { supabaseAdmin } = require("../config/supabase");

async function getTurnosBarbero(req, res) {
  const usuario_id = req.user.id;
  const barberia_id = req.user.barberia_id;

  try {
    // 1. Buscar el registro de barbero vinculado al usuario logueado
    const { data: barbero, error: barberoError } = await supabaseAdmin
      .from("barberos")
      .select("id, nombre")
      .eq("usuario_id", usuario_id)
      .eq("barberia_id", barberia_id)
      .single();

    if (barberoError || !barbero) {
      return res.status(404).json({ error: "Barbero no encontrado para este usuario" });
    }

    // 2. Turnos de hoy filtrados por nombre del barbero
    const hoy = new Date().toISOString().split("T")[0];

    const { data: turnos, error: turnosError } = await supabaseAdmin
      .from("turnos")
      .select("id, hora, nombre, servicio, estado")
      .eq("barbero", barbero.nombre)
      .eq("fecha", hoy)
      .eq("barberia_id", barberia_id)
      .order("hora", { ascending: true });

    if (turnosError) {
      console.error("❌ Error obteniendo turnos:", turnosError);
      return res.status(500).json({ error: "Error obteniendo turnos" });
    }

    res.json({
      barbero_id: barbero.id,
      nombre: barbero.nombre,
      turnos: turnos || [],
    });
  } catch (err) {
    console.error("❌ Error en getTurnosBarbero:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

module.exports = { getTurnosBarbero };
