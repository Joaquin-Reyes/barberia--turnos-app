import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API = "https://barberia-backend-production-7dae.up.railway.app";

export default function Barberos({ user }) {
  const [barberos, setBarberos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: "", telefono: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    traerBarberos();
  }, [user]);

  async function traerBarberos() {
    const { data } = await supabase
      .from("barberos").select("*")
      .eq("barberia_id", user.barberia_id);
    setBarberos(data || []);
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
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Barberos</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
            {barberos.length} barbero{barberos.length !== 1 ? "s" : ""} registrado{barberos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "24px" }}>

        {/* AGREGAR BARBERO */}
        {(user.rol === "admin" || user.rol === "superadmin") && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2>➕ Agregar barbero</h2>
            <div className="form-grid">
              <input
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              />
              <input
                placeholder="Teléfono (54911...)"
                value={nuevo.telefono}
                onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
              />
              <button
                style={{ background: "#16a34a" }}
                onClick={async () => {
                  if (!nuevo.nombre || !nuevo.telefono) {
                    mostrarToast("Completá nombre y teléfono ⚠️", "error");
                    return;
                  }
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${API}/admin/barberos`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(nuevo),
                    });
                    if (res.ok) {
                      mostrarToast("Barbero agregado 💈", "success");
                      setNuevo({ nombre: "", telefono: "" });
                      traerBarberos();
                    } else {
                      mostrarToast("Error al crear barbero ❌", "error");
                    }
                  } catch (err) {
                    mostrarToast("Error de conexión ❌", "error");
                  }
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE BARBEROS */}
        <div className="card">
          <h2>💈 Lista de barberos</h2>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Horario</th>
                {(user.rol === "admin" || user.rol === "superadmin") && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {barberos.map((b) => (
                <tr key={b.id}>
                  <td>{b.nombre}</td>
                  <td>{b.telefono}</td>
                  <td>{b.hora_inicio}:00 – {b.hora_fin}:00</td>
                  {(user.rol === "admin" || user.rol === "superadmin") && (
                    <td>
                      <button
                        onClick={async () => {
                          await supabase.from("barberos").delete().eq("id", b.id);
                          traerBarberos();
                          mostrarToast("Barbero eliminado", "success");
                        }}
                        className="btn-delete"
                        style={{ padding: "4px 10px" }}
                      >
                        ✖
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}