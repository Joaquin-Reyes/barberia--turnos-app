import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Facturacion({ user }) {
  const [turnos, setTurnos] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (!user) return;
    traerTurnos();
  }, [user, fechaFiltro]);

  async function traerTurnos() {
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .eq("barberia_id", user.barberia_id)
      .eq("fecha", fechaFiltro)
      .eq("estado", "completado");
    setTurnos(data || []);
  }

  // CAJA TOTAL DEL DÍA
  const totalDia = turnos.reduce((acc, t) => acc + (t.precio || 0), 0);

  // DESGLOSE POR BARBERO
  const porBarbero = turnos.reduce((acc, t) => {
    if (!acc[t.barbero]) acc[t.barbero] = { turnos: 0, total: 0 };
    acc[t.barbero].turnos += 1;
    acc[t.barbero].total += t.precio || 0;
    return acc;
  }, {});

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
        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
        />
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "24px" }}>

        {/* CAJA DEL DÍA */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 6px" }}>Caja del día</p>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: 0, color: "#16a34a" }}>
              ${totalDia.toLocaleString("es-AR")}
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
              ${turnos.length > 0 ? Math.round(totalDia / turnos.length).toLocaleString("es-AR") : 0}
            </p>
          </div>
        </div>

        {/* DESGLOSE POR BARBERO */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <h2>💈 Facturación por barbero</h2>
          {Object.keys(porBarbero).length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
              No hay turnos completados para esta fecha
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Barbero</th>
                  <th>Turnos</th>
                  <th>Total</th>
                  <th>% del día</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(porBarbero).map(([nombre, info]) => (
                  <tr key={nombre}>
                    <td>{nombre}</td>
                    <td>{info.turnos}</td>
                    <td>${info.total.toLocaleString("es-AR")}</td>
                    <td>
                      {totalDia > 0 ? Math.round((info.total / totalDia) * 100) : 0}%
                    </td>
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
              No hay turnos completados para esta fecha
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Barbero</th>
                    <th>Servicio</th>
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