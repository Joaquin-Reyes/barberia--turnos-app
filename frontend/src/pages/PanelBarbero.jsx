import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API = "https://barberia-backend-production-7dae.up.railway.app";

function formatHora(str) {
  if (!str) return "";
  if (str.includes("T")) {
    return new Date(str).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  return str.slice(0, 5);
}

export default function PanelBarbero({ user }) {
  const [barberoId, setBarberoId] = useState(null);
  const [clienteActual, setClienteActual] = useState(null);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminando, setTerminando] = useState(false);
  const [toast, setToast] = useState(null);

  async function cargarDatos() {
    const token = localStorage.getItem("token");
    try {
      const [colaRes, turnosRes] = await Promise.all([
        fetch(`${API}/cola/${user.barberia_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/barbero/turnos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Procesar turnos primero para obtener el barbero_id real
      let bId = null;
      if (turnosRes.ok) {
        const data = await turnosRes.json();
        setTurnosHoy(data.turnos || []);
        if (data.barbero_id) {
          setBarberoId(data.barbero_id);
          bId = data.barbero_id;
        }
      }

      // Usar el barbero_id para encontrar el cliente actual en la cola
      if (colaRes.ok) {
        const data = await colaRes.json();
        const miBarbero = (data.barberos || []).find((b) => b.id === bId);
        setClienteActual(miBarbero?.cliente_actual || null);
      }
    } catch (err) {
      console.error(err);
      mostrarToast("Error al cargar datos", "error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!user?.barberia_id) return;
    cargarDatos();

    const channel = supabase
      .channel(`panel_barbero_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cola_espera",
          filter: `barberia_id=eq.${user.barberia_id}`,
        },
        () => cargarDatos()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.barberia_id]);

  async function terminar() {
    if (!barberoId) return;
    setTerminando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/cola/terminar/${barberoId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.tipo === "turno_reservado") {
        mostrarToast(`Siguiente: ${data.nombre_cliente} (reservado)`);
      } else if (data.tipo === "cola_espera") {
        mostrarToast(`Siguiente en cola: ${data.nombre_cliente}`);
      } else {
        mostrarToast("Sin clientes en espera");
      }
    } catch {
      mostrarToast("Error al procesar", "error");
    } finally {
      setTerminando(false);
    }
  }

  function mostrarToast(mensaje, tipo = "success") {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  const proxTurno = !clienteActual
    ? turnosHoy.find((t) => t.estado === "confirmado" || t.estado === "pendiente")
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {toast && <div className={`toast ${toast.tipo}`}>{toast.mensaje}</div>}

      {/* TOPBAR */}
      <div style={{
        padding: "16px 24px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Mi Panel</h1>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
          {user?.nombre || user?.email}
        </p>
      </div>

      {cargando ? (
        <div style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          Cargando...
        </div>
      ) : (
        <div style={{ padding: 24, overflowY: "auto" }}>

          {/* TURNO ACTUAL */}
          {clienteActual ? (
            <div style={{
              background: "#f0fdf4",
              border: "2px solid #86efac",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Atendiendo ahora
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#14532d" }}>
                {clienteActual.nombre_cliente}
              </p>
              <p style={{ fontSize: 13, color: "#166534", margin: "0 0 16px" }}>
                Desde las {formatHora(clienteActual.hora_llegada)}
              </p>
              <button
                onClick={terminar}
                disabled={terminando}
                style={{ background: "#16a34a", padding: "12px 24px", fontSize: 14, width: "100%" }}
              >
                {terminando ? "Procesando..." : "Terminé"}
              </button>
            </div>
          ) : proxTurno ? (
            <div style={{
              background: "#eff6ff",
              border: "2px solid #93c5fd",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Próximo turno
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#1e3a8a" }}>
                {proxTurno.nombre}
              </p>
              <p style={{ fontSize: 13, color: "#1e40af", margin: 0 }}>
                {formatHora(proxTurno.hora)} — {proxTurno.servicio}
              </p>
            </div>
          ) : (
            <div style={{
              background: "#f9fafb",
              border: "2px solid #e5e7eb",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 20,
              textAlign: "center",
            }}>
              <p style={{ fontSize: 15, color: "#9ca3af", margin: 0 }}>
                Sin clientes por el momento
              </p>
            </div>
          )}

          {/* TURNOS DEL DÍA */}
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Turnos de hoy</h2>
            {turnosHoy.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                No tenés turnos reservados para hoy.
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosHoy.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{formatHora(t.hora)}</td>
                        <td>{t.nombre}</td>
                        <td style={{ fontSize: 13, color: "#6b7280" }}>{t.servicio}</td>
                        <td>
                          <span className={`estado ${t.estado}`}>{t.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
