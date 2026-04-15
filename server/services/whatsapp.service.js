const axios = require("axios");
const { supabaseAdmin } = require("../config/supabase");

async function enviarMensaje(numero, mensaje, phone_number_id) {
  try {
    console.log("📨 enviarMensaje llamado con:", numero);

    const url = `https://graph.facebook.com/v18.0/${phone_number_id || process.env.PHONE_NUMBER_ID}/messages`;

    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensaje }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Mensaje enviado a", numero);
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error.response?.data || error.message);
  }
}

async function notificarBarbero(datos) {
  console.log("🔔 NOTIFICANDO BARBERO...");

  const { data: barberia } = await supabaseAdmin
    .from("barberias")
    .select("phone_number_id")
    .eq("id", datos.barberia_id)
    .single();

  const phone_number_id = barberia?.phone_number_id;

  if (!phone_number_id) {
    console.log("❌ Barbería sin WhatsApp configurado");
    return;
  }

  const { data: barberoData } = await supabaseAdmin
    .from("barberos")
    .select("telefono")
    .ilike("nombre", datos.barbero)
    .eq("barberia_id", datos.barberia_id);

  const telefono = barberoData?.[0]?.telefono;

  if (!telefono) {
    console.log("⚠️ No hay número para el barbero:", datos.barbero);
    return;
  }

  // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
  const [y, m, d] = String(datos.fecha).split("-");
  const fechaFormateada = `${d}/${m}/${y}`;

  // Hora en formato HH:mm
  const horaFormateada = String(datos.hora).slice(0, 5);

  console.log("📤 Enviando plantilla a barbero:", telefono);

  const url = `https://graph.facebook.com/v18.0/${phone_number_id}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: telefono,
        type: "template",
        template: {
          name: "nuevo_turno_barbero_v2",
          language: { code: "es_AR" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: datos.barbero },
                { type: "text", text: datos.nombre },
                { type: "text", text: fechaFormateada },
                { type: "text", text: horaFormateada },
                { type: "text", text: datos.servicio }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Plantilla enviada al barbero:", datos.barbero);
  } catch (error) {
    console.error("❌ Error enviando plantilla al barbero:", error.response?.data || error.message);
  }
}

async function enviarTemplateConfirmacion({ telefono, servicio, barbero, fecha, horario, precio }) {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to: telefono,
      type: "template",
      template: {
        name: "turno_confirmado_v2",
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: servicio },
              { type: "text", text: barbero },
              { type: "text", text: fecha },
              { type: "text", text: horario },
              { type: "text", text: String(precio) }
            ]
          }
        ]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

module.exports = { enviarMensaje, notificarBarbero, enviarTemplateConfirmacion };
