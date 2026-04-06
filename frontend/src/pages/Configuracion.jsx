import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Configuracion({ user }) {
  const [servicios, setServicios] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: "", precio: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    traerServicios();
  }, [user]);

  async function traerServicios() {
    const { data } = await supabase
      .from("servicios")
      .select("*")
      .eq("barberia_id", user.barberia_id);
    setServicios(data || []);
  }

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {toast && <div className={`toast ${toast.tipo}`}>{toast.mensaje}</div>}

      {/* TOPBAR */}
      <div style={{
        padding: "16px 24px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Configuración</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
            Servicios y precios de tu barbería
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "24px" }}>

        {/* AGREGAR SERVICIO */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <h2>➕ Agregar servicio</h2>
          <div className="form-grid">
            <input
              placeholder="Nombre del servicio (ej: Corte)"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />
            <input
              placeholder="Precio"
              type="number"
              value={nuevo.precio}
              onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
            />
            <button
              style={{ background: "#16a34a" }}
              onClick={async () => {
                if (!nuevo.nombre || !nuevo.precio) {
                  mostrarToast("Completá nombre y precio ⚠️", "error");
                  return;
                }
                const { error } = await supabase.from("servicios").insert({
                  nombre: nuevo.nombre,
                  precio: parseFloat(nuevo.precio),
                  barberia_id: user.barberia_id,
                });
                if (!error) {
                  mostrarToast("Servicio agregado ✅", "success");
                  setNuevo({ nombre: "", precio: "" });
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

        {/* LISTA DE SERVICIOS */}
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