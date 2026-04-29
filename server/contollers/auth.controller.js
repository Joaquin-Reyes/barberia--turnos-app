const { createClient } = require("@supabase/supabase-js");
const { supabaseAdmin } = require("../config/supabase");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function adminLogin(req, res) {
  console.log("BODY:", req.body);
  const { password } = req.body;
  console.log("PASSWORD RECIBIDA:", password);

  if (password === ADMIN_PASSWORD) {
    req.session.auth = true;
    return res.json({ ok: true });
  }

  res.status(401).json({ error: "Password incorrecta" });
}

function barberoLogin(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });
  req.session.barbero = nombre;
  res.json({ ok: true });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
}

async function activarCuenta(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido" });

  const { data: existente } = await supabaseAdmin
    .from("usuarios")
    .select("id, barbero_id")
    .eq("id", user.id)
    .maybeSingle();

  const { rol, barberia_id, nombre, barbero_id } = user.user_metadata || {};

  if (existente) {
    // Ya existe en usuarios — asegurar que barberos.usuario_id esté vinculado
    const bId = existente.barbero_id || barbero_id;
    if (bId) {
      await supabaseAdmin
        .from("barberos")
        .update({ usuario_id: user.id })
        .eq("id", bId);
    }
    return res.json({ ok: true });
  }

  if (!rol || !barberia_id) {
    return res.status(400).json({ error: "Metadata de invitación incompleta" });
  }

  const { error: insertError } = await supabaseAdmin
    .from("usuarios")
    .insert({ id: user.id, email: user.email, rol, barberia_id, nombre, barbero_id });

  if (insertError) {
    console.log("❌ Error creando usuario:", insertError);
    return res.status(500).json({ error: "Error creando usuario" });
  }

  // Vincular barberos.usuario_id para que el barbero pueda acceder a su panel
  if (barbero_id) {
    await supabaseAdmin
      .from("barberos")
      .update({ usuario_id: user.id })
      .eq("id", barbero_id);
  }

  res.json({ ok: true });
}

module.exports = { adminLogin, barberoLogin, logout, activarCuenta };
