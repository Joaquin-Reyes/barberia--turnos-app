import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function SuperAdminPanel({ user, onLogout }) {
  const [barberias, setBarberias] = useState([]);
  const [nombre, setNombre] = useState("");

  // 🔥 cargar barberías
  useEffect(() => {
    traerBarberias();
  }, []);

  async function traerBarberias() {
    const { data, error } = await supabase
      .from("barberias")
      .select("*");

    if (error) {
      console.error("Error trayendo barberías:", error);
      return;
    }

    setBarberias(data || []);
  }

  // 🔥 crear barbería
  async function crearBarberia() {
    if (!nombre) return;

    const { error } = await supabase
      .from("barberias")
      .insert([{ nombre }]);

    if (error) {
      console.error("Error creando barbería:", error);
      return;
    }

    setNombre("");
    traerBarberias();
  }

  // 🔥 activar / desactivar
  async function toggleActiva(barberia) {
    const { error } = await supabase
      .from("barberias")
      .update({ activo: !barberia.activo })
      .eq("id", barberia.id);

    if (error) {
      console.error("Error actualizando barbería:", error);
      return;
    }

    traerBarberias();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">👑 Panel SuperAdmin</h1>
          <p className="text-sm text-neutral-400">
            {user.email} · {user.rol}
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-neutral-800 px-4 py-1 rounded"
        >
          Cerrar sesión
        </button>
      </div>

      {/* CREAR BARBERÍA */}
      <div className="mb-6 bg-neutral-900 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">➕ Crear barbería</h2>

        <div className="flex gap-2">
          <input
            placeholder="Nombre de la barbería"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input w-full"
          />

          <button
            onClick={crearBarberia}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Crear
          </button>
        </div>
      </div>

      {/* LISTA DE BARBERÍAS */}
      <div className="bg-neutral-900 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">🏪 Barberías</h2>

        <div className="space-y-3">
          {barberias.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center bg-neutral-800 p-3 rounded"
            >
              <div>
                <p className="font-semibold">{b.nombre}</p>
                <p className="text-xs text-neutral-400">{b.id}</p>
              </div>

              <button
                onClick={() => toggleActiva(b)}
                className={`px-3 py-1 rounded text-sm ${
                  b.activo ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {b.activo ? "Activa" : "Inactiva"}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}