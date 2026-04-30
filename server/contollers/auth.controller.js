const { supabaseAdmin } = require("../config/supabase");

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

function getMetadataBarberoId(metadata = {}) {
  return (
    metadata.barbero_id ||
    metadata.barberoId ||
    metadata.barber_id ||
    metadata.barberId ||
    metadata.barbero?.id ||
    metadata.barber?.id ||
    null
  );
}

function buildUsuarioPayload({ id, email, rol, barberia_id, nombre }) {
  return { id, email, rol, barberia_id, nombre };
}

function withBarberoId(usuario, barbero_id) {
  if (!usuario || !barbero_id) return usuario;
  return { ...usuario, barbero_id };
}

async function activarCuenta(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido" });

  const metadata = user.user_metadata || {};
  const metadataBarberoId = getMetadataBarberoId(metadata);

  const { data: existente } = await supabaseAdmin
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { rol, barberia_id, nombre } = metadata;
  const barbero_id = metadataBarberoId;

  if (existente) {
    // Ya existe — asegurar que barberos.usuario_id esté vinculado
    const bId = existente.barbero_id || barbero_id;
    if (bId) {
      await supabaseAdmin
        .from("barberos")
        .update({ usuario_id: user.id })
        .eq("id", bId);

    }

    const { data: usuarioActualizado } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return res.json({ ok: true, usuario: withBarberoId(usuarioActualizado || existente, bId) });
  }

  // Si la metadata tiene los datos necesarios, crear el usuario directamente
  if (rol && barberia_id) {
    const { error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert(buildUsuarioPayload({ id: user.id, email: user.email, rol, barberia_id, nombre }));

    if (insertError) {
      console.log("❌ Error creando usuario:", insertError);
      return res.status(500).json({ error: "Error creando usuario" });
    }

    if (barbero_id) {
      await supabaseAdmin
        .from("barberos")
        .update({ usuario_id: user.id })
        .eq("id", barbero_id);
    }

    const { data: creado } = await supabaseAdmin.from("usuarios").select("*").eq("id", user.id).maybeSingle();
    console.log("✅ Activación por metadata para", user.email);
    return res.json({ ok: true, usuario: withBarberoId(creado, barbero_id) });
  }

  // Fallback: metadata vacía — buscar barbero por barbero_id, usuario_id, o único sin vincular
  console.log("⚠️ Metadata incompleta para user", user.id, "| metadata:", user.user_metadata, "| intentando fallback");

  // Caso 0: metadata tiene barbero_id aunque le falte rol/barberia_id
  if (barbero_id) {
    const { data: barberoById } = await supabaseAdmin
      .from("barberos")
      .select("id, nombre, barberia_id")
      .eq("id", barbero_id)
      .maybeSingle();

    if (barberoById) {
      const { error: insertError } = await supabaseAdmin
        .from("usuarios")
        .insert(buildUsuarioPayload({ id: user.id, email: user.email, rol: "barbero", barberia_id: barberoById.barberia_id, nombre: barberoById.nombre }));
      if (!insertError) {
        await supabaseAdmin.from("barberos").update({ usuario_id: user.id }).eq("id", barberoById.id);
        const { data: creado } = await supabaseAdmin.from("usuarios").select("*").eq("id", user.id).maybeSingle();
        console.log("✅ Activación por barbero_id en metadata para", user.email);
        return res.json({ ok: true, usuario: withBarberoId(creado, barberoById.id) });
      }
      console.log("❌ Error creando usuario (fallback barbero_id):", insertError);
    }
  }

  // Caso 1: el barbero ya tiene usuario_id = user.id pero nunca se creó el registro en usuarios
  const { data: barberoYaVinculado } = await supabaseAdmin
    .from("barberos")
    .select("id, nombre, barberia_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (barberoYaVinculado) {
    const { error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert(buildUsuarioPayload({ id: user.id, email: user.email, rol: "barbero", barberia_id: barberoYaVinculado.barberia_id, nombre: barberoYaVinculado.nombre }));
    if (insertError) {
      console.log("❌ Error creando usuario (fallback vinculado):", insertError);
      return res.status(500).json({ error: "Error creando usuario" });
    }
    const { data: creado } = await supabaseAdmin.from("usuarios").select("*").eq("id", user.id).maybeSingle();
    console.log("✅ Activación por barbero ya vinculado para", user.email, "→", barberoYaVinculado.nombre);
    return res.json({ ok: true, usuario: withBarberoId(creado, barberoYaVinculado.id) });
  }

  // Caso 2: buscar barbero sin vincular
  const { data: barberoMatch } = await supabaseAdmin
    .from("barberos")
    .select("id, nombre, barberia_id")
    .is("usuario_id", null)
    .limit(50);

  if (!barberoMatch || barberoMatch.length === 0) {
    console.log("❌ No se encontraron barberos sin vincular para", user.email);
    return res.status(400).json({ error: "No se pudo activar la cuenta. Pedile al admin que reenvíe la invitación." });
  }

  if (barberoMatch.length === 1) {
    const b = barberoMatch[0];
    const { error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert(buildUsuarioPayload({ id: user.id, email: user.email, rol: "barbero", barberia_id: b.barberia_id, nombre: b.nombre }));

    if (insertError) {
      console.log("❌ Error creando usuario (fallback único barbero):", insertError);
      return res.status(500).json({ error: "Error creando usuario" });
    }

    await supabaseAdmin.from("barberos").update({ usuario_id: user.id }).eq("id", b.id);
    const { data: creado } = await supabaseAdmin.from("usuarios").select("*").eq("id", user.id).maybeSingle();
    console.log("✅ Activación por único barbero disponible para", user.email, "→", b.nombre);
    return res.json({ ok: true, usuario: withBarberoId(creado, b.id) });
  }

  console.log("❌ Metadata incompleta y hay múltiples barberos sin vincular para", user.email);
  return res.status(400).json({ error: "No se pudo activar la cuenta automáticamente. Pedile al admin que reenvíe la invitación." });
}

module.exports = { adminLogin, barberoLogin, logout, activarCuenta };
