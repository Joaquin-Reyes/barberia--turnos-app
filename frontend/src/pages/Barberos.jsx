import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API = "https://barberia-backend-production-7dae.up.railway.app";

const DIAS_SEMANA = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

const horarioDefault = () => {
  const h = {};
  DIAS_SEMANA.forEach(({ dia }) => {
    h[dia] = { trabaja: false, hora_inicio: "09:00", hora_fin: "19:00" };
  });
  return h;
};

export default function Barberos({ user }) {
  const [barberos, setBarberos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: "", telefono: "" });
  const [toast, setToast] = useState(null);

  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [horarioSemanal, setHorarioSemanal] = useState(horarioDefault());
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  const [excepciones, setExcepciones] = useState([]);
  const [nuevaExcepcion, setNuevaExcepcion] = useState({
    fecha: "", trabaja: false, hora_inicio: "", hora_fin: "", motivo: ""
  });

  useEffect(() => {
    if (!user) return;
    traerBarberos();
  }, [user]);

  async function traerBarberos() {
    const { data } = await supabase
      .from("barberos")
      .select("*")
      .eq("barberia_id", user.barberia_id);
    setBarberos(data || []);
  }

  async function seleccionarBarbero(barbero) {
    if (barberoSeleccionado?.id === barbero.id) {
      setBarberoSeleccionado(null);
      return;
    }
    setBarberoSeleccionado(barbero);
    await Promise.all([
      cargarHorario(barbero.id),
      cargarExcepciones(barbero.id),
    ]);
  }

  // ==============================
  // HORARIO SEMANAL
  // ==============================

  async function cargarHorario(barberoId) {
    const { data } = await supabase
      .from("horarios_barbero")
      .select("*")
      .eq("barbero_id", barberoId);

    const base = horarioDefault();
    (data || []).forEach(h => {
      base[h.dia_semana] = {
        trabaja: true,
        hora_inicio: String(h.hora_inicio).slice(0, 5),
        hora_fin: String(h.hora_fin).slice(0, 5),
      };
    });
    setHorarioSemanal(base);
  }

  async function guardarHorario() {
    if (!barberoSeleccionado) return;
    setGuardandoHorario(true);

    try {
      // Borrar el horario existente y reemplazar
      await supabase
        .from("horarios_barbero")
        .delete()
        .eq("barbero_id", barberoSeleccionado.id);

      const filas = DIAS_SEMANA
        .filter(({ dia }) => horarioSemanal[dia]?.trabaja)
        .map(({ dia }) => ({
          barbero_id: barberoSeleccionado.id,
          barberia_id: user.barberia_id,
          dia_semana: dia,
          hora_inicio: horarioSemanal[dia].hora_inicio,
          hora_fin: horarioSemanal[dia].hora_fin,
        }));

      if (filas.length > 0) {
        const { error } = await supabase.from("horarios_barbero").insert(filas);
        if (error) throw error;
      }

      mostrarToast("Horario guardado ✅");
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar horario ❌", "error");
    } finally {
      setGuardandoHorario(false);
    }
  }

  function toggleDia(dia) {
    setHorarioSemanal(prev => ({
      ...prev,
      [dia]: { ...prev[dia], trabaja: !prev[dia].trabaja }
    }));
  }

  function actualizarHoraDia(dia, campo, valor) {
    setHorarioSemanal(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor }
    }));
  }

  // ==============================
  // EXCEPCIONES
  // ==============================

  async function cargarExcepciones(barberoId) {
    const { data } = await supabase
      .from("excepciones_barbero")
      .select("*")
      .eq("barbero_id", barberoId)
      .order("fecha", { ascending: true });
    setExcepciones(data || []);
  }

  async function agregarExcepcion() {
    if (!nuevaExcepcion.fecha) {
      mostrarToast("Elegí una fecha ⚠️", "error");
      return;
    }

    const fila = {
      barbero_id: barberoSeleccionado.id,
      barberia_id: user.barberia_id,
      fecha: nuevaExcepcion.fecha,
      trabaja: nuevaExcepcion.trabaja,
      hora_inicio: nuevaExcepcion.trabaja && nuevaExcepcion.hora_inicio
        ? nuevaExcepcion.hora_inicio : null,
      hora_fin: nuevaExcepcion.trabaja && nuevaExcepcion.hora_fin
        ? nuevaExcepcion.hora_fin : null,
      motivo: nuevaExcepcion.motivo || null,
    };

    const { error } = await supabase
      .from("excepciones_barbero")
      .upsert(fila, { onConflict: "barbero_id,fecha" });

    if (error) {
      mostrarToast("Error al guardar excepción ❌", "error");
      return;
    }

    setNuevaExcepcion({ fecha: "", trabaja: false, hora_inicio: "", hora_fin: "", motivo: "" });
    await cargarExcepciones(barberoSeleccionado.id);
    mostrarToast("Excepción guardada ✅");
  }

  async function eliminarExcepcion(id) {
    await supabase.from("excepciones_barbero").delete().eq("id", id);
    await cargarExcepciones(barberoSeleccionado.id);
    mostrarToast("Excepción eliminada");
  }

  // ==============================
  // HELPERS UI
  // ==============================

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const esAdmin = user.rol === "admin" || user.rol === "superadmin";

  // ==============================
  // RENDER
  // ==============================

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

      <div style={{ padding: "24px", overflowY: "auto" }}>

        {/* AGREGAR BARBERO */}
        {esAdmin && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2>➕ Agregar barbero</h2>
            <div className="form-grid">
              <input
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              />
              <input
                placeholder="Teléfono (ej: 1123456789)"
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
                      mostrarToast("Barbero agregado 💈");
                      setNuevo({ nombre: "", telefono: "" });
                      traerBarberos();
                    } else {
                      mostrarToast("Error al crear barbero ❌", "error");
                    }
                  } catch {
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
        <div className="card" style={{ marginBottom: "20px" }}>
          <h2>💈 Lista de barberos</h2>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Horario</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {barberos.map((b) => (
                <tr
                  key={b.id}
                  style={{
                    background: barberoSeleccionado?.id === b.id ? "#f0fdf4" : undefined,
                    cursor: "pointer",
                  }}
                  onClick={() => seleccionarBarbero(b)}
                >
                  <td style={{ fontWeight: barberoSeleccionado?.id === b.id ? 600 : undefined }}>
                    {b.nombre}
                    {barberoSeleccionado?.id === b.id && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#16a34a" }}>▼ editando</span>
                    )}
                  </td>
                  <td>{b.telefono}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    Click para configurar
                  </td>
                  {esAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          if (barberoSeleccionado?.id === b.id) setBarberoSeleccionado(null);
                          await supabase.from("barberos").delete().eq("id", b.id);
                          traerBarberos();
                          mostrarToast("Barbero eliminado");
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

        {/* PANEL DE CONFIGURACIÓN */}
        {barberoSeleccionado && esAdmin && (
          <>
            {/* HORARIO SEMANAL */}
            <div className="card" style={{ marginBottom: "20px" }}>
              <h2>🗓️ Horario semanal — {barberoSeleccionado.nombre}</h2>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Marcá los días que trabaja y configurá la hora de entrada y salida.
              </p>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Día</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                  </tr>
                </thead>
                <tbody>
                  {DIAS_SEMANA.map(({ dia, nombre }) => (
                    <tr key={dia} style={{ opacity: horarioSemanal[dia]?.trabaja ? 1 : 0.45 }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={horarioSemanal[dia]?.trabaja || false}
                          onChange={() => toggleDia(dia)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{nombre}</td>
                      <td>
                        <input
                          type="time"
                          value={horarioSemanal[dia]?.hora_inicio || "09:00"}
                          disabled={!horarioSemanal[dia]?.trabaja}
                          onChange={(e) => actualizarHoraDia(dia, "hora_inicio", e.target.value)}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={horarioSemanal[dia]?.hora_fin || "19:00"}
                          disabled={!horarioSemanal[dia]?.trabaja}
                          onChange={(e) => actualizarHoraDia(dia, "hora_fin", e.target.value)}
                          style={{ width: 110 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 16 }}>
                <button
                  style={{ background: "#16a34a" }}
                  onClick={guardarHorario}
                  disabled={guardandoHorario}
                >
                  {guardandoHorario ? "Guardando..." : "💾 Guardar horario"}
                </button>
              </div>
            </div>

            {/* EXCEPCIONES */}
            <div className="card">
              <h2>⚠️ Excepciones — {barberoSeleccionado.nombre}</h2>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Fechas donde no trabaja o tiene un horario especial (feriados, vacaciones, etc.)
              </p>

              {/* FORM NUEVA EXCEPCIÓN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Fecha</label>
                  <input
                    type="date"
                    value={nuevaExcepcion.fecha}
                    onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Motivo</label>
                  <input
                    placeholder="ej: feriado"
                    value={nuevaExcepcion.motivo}
                    onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, motivo: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={nuevaExcepcion.trabaja}
                      onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, trabaja: e.target.checked })}
                      style={{ marginRight: 4 }}
                    />
                    Trabaja (horario distinto)
                  </label>
                  {nuevaExcepcion.trabaja && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type="time"
                        value={nuevaExcepcion.hora_inicio}
                        onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, hora_inicio: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="time"
                        value={nuevaExcepcion.hora_fin}
                        onChange={(e) => setNuevaExcepcion({ ...nuevaExcepcion, hora_fin: e.target.value })}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}
                </div>
                <div style={{ alignSelf: "end" }}>
                  <button style={{ background: "#2563eb" }} onClick={agregarExcepcion}>
                    ➕ Agregar
                  </button>
                </div>
              </div>

              {/* LISTA DE EXCEPCIONES */}
              {excepciones.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Sin excepciones cargadas.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Horario especial</th>
                      <th>Motivo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {excepciones.map((ex) => (
                      <tr key={ex.id}>
                        <td>{ex.fecha}</td>
                        <td>
                          {ex.trabaja
                            ? <span style={{ color: "#16a34a", fontWeight: 500 }}>Trabaja</span>
                            : <span style={{ color: "#dc2626", fontWeight: 500 }}>No trabaja</span>
                          }
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {ex.trabaja && ex.hora_inicio
                            ? `${String(ex.hora_inicio).slice(0,5)} – ${String(ex.hora_fin).slice(0,5)}`
                            : "—"
                          }
                        </td>
                        <td style={{ fontSize: 13, color: "#6b7280" }}>{ex.motivo || "—"}</td>
                        <td>
                          <button
                            className="btn-delete"
                            style={{ padding: "4px 10px" }}
                            onClick={() => eliminarExcepcion(ex.id)}
                          >
                            ✖
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
