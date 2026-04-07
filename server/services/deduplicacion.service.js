const { supabase } = require("../config/supabase");

async function mensajeYaProcesado(id) {
  const { data } = await supabase
    .from("mensajes_procesados")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return !!data;
}

async function guardarMensajeProcesado(id) {
  await supabase.from("mensajes_procesados").insert([{ id }]);
}

module.exports = { mensajeYaProcesado, guardarMensajeProcesado };
