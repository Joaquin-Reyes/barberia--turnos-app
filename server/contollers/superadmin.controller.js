const { supabaseAdmin } = require("../config/supabase");

async function crearBarberia(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const { data: authUser, error: errorAuth } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (errorAuth) {
      console.error("❌ Error auth:", errorAuth);
      return res.status(500).json({ error: "Error creando usuario" });
    }

    const userId = authUser.user.id;

    const { data: barberia, error: errorBarberia } =
      await supabaseAdmin
        .from("barberias")
        .insert([{ nombre }])
        .select()
        .single();

    if (errorBarberia) {
      console.error("❌ Error barbería:", errorBarberia);
      return res.status(500).json({ error: "Error creando barbería" });
    }

    const { error: errorUsuario } = await supabaseAdmin
      .from("usuarios")
      .insert([{
        id: userId,
        email,
        rol: "admin",
        barberia_id: barberia.id,
      }]);

    if (errorUsuario) {
      console.error("❌ Error usuario:", errorUsuario);
      return res.status(500).json({ error: "Error vinculando usuario" });
    }

    res.json({ ok: true, barberia, userId });

  } catch (err) {
    console.error("💥 Error general:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

module.exports = { crearBarberia };
