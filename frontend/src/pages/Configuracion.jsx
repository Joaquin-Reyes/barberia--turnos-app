import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Configuracion({ user }) {
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: "", precio: "" });
  const [barberia, setBarberia] = useState(null);
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    traerServicios();
    traerBarberia();
  }, [user]);

  async function traerServicios() {
    const { data } = await supabase
      .from("servicios").select("*")
      .eq("barberia_id", user.barberia_id);
    setServicios(data || []);
  }

  async function traerBarberia() {
    const { data } = await supabase
      .from("barberias").select("*")
      .eq("id", user.barberia_id)
      .single();
    setBarberia(data || null);
  }

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  async function guardarBarberia() {
    const { error } = await supabase
      .from("barberias")
      .update({
        nombre: barberia.nombre,
        telefono_admin: barberia.telefono_admin,
        whatsapp_number: barberia.whatsapp_number,
      })
      .eq("id", user.barberia_id);

    if (!error) {
      mostrarToast("Datos guardados ✅");
      setEditando(false);
    } else {
      mostrarToast("Error al guardar ❌", "error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {toast && <div className={`toast ${toast.tipo}`}>{toast.mensaje}</div>}

      {/* TOPBAR */}
      <div style={{
        padding: "16px 24px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Configuración</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
            Datos y servicios de tu barbería
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "24px" }}>

        {/* DATOS DE LA BARBERÍA */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>🏪 Datos de la barbería</h2>
            {!editando ? (
              <button
                onClick={() => setEditando(true)}
                style={{ background: "#2563eb", padding: "6px 14px", fontSize: "13px" }}
              >
                Editar
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { setEditando(false); traerBarberia(); }}
                  style={{ background: "#6b7280", padding: "6px 14px", fontSize: "13px" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarBarberia}
                  style={{ background: "#16a34a", padding: "6px 14px", fontSize: "13px" }}
                >
                  Guardar
                </button>
              </div>
            )}
          </div>

          {barberia && (
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 0", color: "#6b7280", width: "180px", fontSize: "13px" }}>Nombre</td>
                  <td style={{ padding: "10px 0" }}>
                    {editando ? (
                      <input
                        value={barberia.nombre || ""}
                        onChange={(e) => setBarberia({ ...barberia, nombre: e.target.value })}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <span style={{ fontSize: "13px" }}>{barberia.nombre}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", borderTop: "1px solid #f3f4f6" }}>Teléfono admin</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
                    {editando ? (
                      <input
                        value={barberia.telefono_admin || ""}
                        onChange={(e) => setBarberia({ ...barberia, telefono_admin: e.target.value })}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <span style={{ fontSize: "13px" }}>{barberia.telefono_admin || "—"}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", borderTop: "1px solid #f3f4f6" }}>WhatsApp número</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
                    {editando ? (
                      <input
                        value={barberia.whatsapp_number || ""}
                        onChange={(e) => setBarberia({ ...barberia, whatsapp_number: e.target.value })}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <span style={{ fontSize: "13px" }}>{barberia.whatsapp_number || "—"}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", borderTop: "1px solid #f3f4f6" }}>Estado</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
                    <span style={{
                      fontSize: "12px",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: barberia.activo ? "#dcfce7" : "#fee2e2",
                      color: barberia.activo ? "#166534" : "#991b1b",
                    }}>
                      {barberia.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", borderTop: "1px solid #f3f4f6" }}>Notificaciones</td>
                  <td style={{ padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {["Recordatorio 24hs", "Recordatorio 3hs", "Confirmación al cliente", "Notificación al barbero"].map(n => (
                        <span key={n} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "#16a34a", fontWeight: "600" }}>✓</span> {n}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* SERVICIOS */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <h2>➕ Agregar servicio</h2>
          <div className="form-grid">
            <input
              placeholder="Nombre del servicio (ej: Corte)"
              value={nuevoServicio.nombre}
              onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
            />
            <input
              placeholder="Precio"
              type="number"
              value={nuevoServicio.precio}
              onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
            />
            <button
              style={{ background: "#16a34a" }}
              onClick={async () => {
                if (!nuevoServicio.nombre || !nuevoServicio.precio) {
                  mostrarToast("Completá nombre y precio ⚠️", "error");
                  return;
                }
                const { error } = await supabase.from("servicios").insert({
                  nombre: nuevoServicio.nombre,
                  precio: parseFloat(nuevoServicio.precio),
                  barberia_id: user.barberia_id,
                });
                if (!error) {
                  mostrarToast("Servicio agregado ✅");
                  setNuevoServicio({ nombre: "", precio: "" });
                  traerServicios();
                } else {
                  mostrarToast("Error al guardar ❌", "error");
                }
              }}
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="card">
          <h2>💈 Servicios configurados</h2>
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Precio</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
                    No hay servicios cargados todavía
                  </td>
                </tr>
              )}
              {servicios.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>${s.precio.toLocaleString("es-AR")}</td>
                  <td>
                    <button
                      onClick={async () => {
                        await supabase.from("servicios").delete().eq("id", s.id);
                        traerServicios();
                        mostrarToast("Servicio eliminado", "success");
                      }}
                      className="btn-delete"
                      style={{ padding: "4px 10px" }}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}