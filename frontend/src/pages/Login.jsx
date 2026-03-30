import { useState } from "react";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // 🔥 lógica simple (después la mejoramos)
    if (usuario === "admin" && password === "1234") {
      onLogin({ tipo: "admin", nombre: "Admin" });
    } else {
      // ejemplo barbero
      onLogin({ tipo: "barbero", nombre: usuario });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="bg-neutral-900 p-6 rounded-2xl w-80">
        <h2 className="text-xl mb-4 font-bold text-center">🔐 Login</h2>

        <input
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full mb-3 bg-neutral-800 p-2 rounded-xl"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 bg-neutral-800 p-2 rounded-xl"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 py-2 rounded-xl"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}