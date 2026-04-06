import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Facturacion({ user }) {
  const [turnos, setTurnos] = useState([]);
  const [periodo, setPeriodo] = useState("dia");
  const [fechaFiltro, setFechaFiltro] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (!user) return;
    traerTurnos();
  }, [user, fechaFiltro, periodo]);

  async function traerTurnos() {
    let query = supabase
      .from("turnos")
      .select("*")
      .eq("barberia_id", user.barberia_id)
      .eq("estado", "completado");

    if (periodo === "dia") {
      query = query.eq("fecha", fechaFiltro);
    } else if (periodo === "semana") {
      const inicio = getLunesDeEstaSemana(fechaFiltro);
      const fin = getDomingoDeEstaSemana(fechaFiltro);
      query = query.gte("fecha", inicio).lte("fecha", fin);
    } else if (periodo === "mes") {
      const inicio = fechaFiltro.slice(0, 7) + "-01";
      const fin = getUltimoDiaMes(fechaFiltro);
      query = query.gte("fecha", inicio).lte("fecha", fin);
    }

    const { data } = await query;
    setTurnos(data || []);
  }

  // HELPERS FECHA
  function getLunesDeEstaSemana(fecha) {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }

  function getDomingoDeEstaSemana(fecha) {
    const d = new Date(getLunesDeEstaSemana(fecha));
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  }

  function getUltimoDiaMes(fecha) {
    const d = new Date(fecha);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString().split("T")[0];
  }

  // CALCULOS
  const totalPeriodo = turnos.reduce((acc, t) => acc + (t.precio || 0), 0);
  const promedioPorTurno = turnos.length > 0 ? Math.round(totalPeriodo / turnos.length) : 0;

  // DESGLOSE POR BARBERO
  const porBarbero = turnos.reduce((acc, t) => {
    if (!acc[t.barbero]) acc[t.barbero] = { turnos: 0, total: 0 };
    acc[t.barbero].turnos += 1;
    acc[t.barbero].total += t.precio || 0;
    return acc;
  }, {});

  const barberosList = Object.entries(porBarbero)
    .map(([nombre, info]) => ({ nombre, ...info }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = barberosList.length > 0 ? barberosList[0].total : 1;

  const labelPeriodo = periodo === "dia" ? "del día" : periodo === "semana" ? "de la semana" : "del mes";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

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
          <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Facturación</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
            Solo turnos completados
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* SELECTOR PERÍODO */}
          <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            {["dia", "semana", "mes"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: 0,
                  background: periodo === p ? "#2563eb" : "#ffffff",
                  color: periodo === p ? "#ffffff" : "#6b7280",
                  cursor: "pointer",
                  fontWeight: periodo === p ? "600" : "400",
                }}
              >
                {p === "dia" ? "Día" : p === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "24px", overflowY: "auto" }}>

        {/* RESUMEN */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 6px" }}>
              Total {labelPeriodo}
            </p>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: 0, color: "#16a34a" }}>
              ${totalPeriodo.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 6px" }}>Turnos completados</p>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
              {turnos.length}
            </p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 6px" }}>Promedio por turno</p>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
              ${promedioPorTurno.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* GRÁFICO POR BARBERO */}
        {barberosList.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2>📊 Facturación por barbero</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              {barberosList.map((b) => (
                <div key={b.nombre}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>{b.nombre}</span>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      ${b.total.toLocaleString("es-AR")} · {b.turnos} turno{b.turnos !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.round((b.total / maxTotal) * 100)}%`,
                      background: "#2563eb",
                      height: "100%",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                    {totalPeriodo > 0 ? Math.round((b.total / totalPeriodo) * 100) : 0}% del total
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RANKING TABLA */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <h2>🏆 Ranking {labelPeriodo}</h2>
          {barberosList.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
              No hay turnos completados para este período
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Barbero</th>
                  <th>Turnos</th>
                  <th>Total</th>
                  <th>Promedio</th>
                  <th>% del total</th>
                </tr>
              </thead>
              <tbody>
                {barberosList.map((b, i) => (
                  <tr key={b.nombre}>
                    <td>
                      <span style={{
                        fontWeight: "700",
                        color: i === 0 ? "#ca8a04" : i === 1 ? "#6b7280" : "#92400e",
                      }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: "500" }}>{b.nombre}</td>
                    <td>{b.turnos}</td>
                    <td>${b.total.toLocaleString("es-AR")}</td>
                    <td>${Math.round(b.total / b.turnos).toLocaleString("es-AR")}</td>
                    <td>{totalPeriodo > 0 ? Math.round((b.total / totalPeriodo) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* DETALLE DE TURNOS */}
        <div className="card">
          <h2>📋 Detalle de turnos</h2>
          {turnos.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
              No hay turnos completados para este período
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Barbero</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t) => (
                    <tr key={t.id}>
                      <td>{t.nombre}</td>
                      <td>{t.barbero}</td>
                      <td>{t.servicio}</td>
                      <td>{t.fecha}</td>
                      <td>{t.hora}</td>
                      <td>${(t.precio || 0).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}