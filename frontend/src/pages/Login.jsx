import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Scissors } from "lucide-react";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usuario,
      password: password,
    });

    if (error) {
      console.error(error);
      setError("Credenciales incorrectas");
      setLoading(false);
      return;
    }

    const token = data.session.access_token;
    localStorage.setItem("token", token);

    const { data: usuarioDB, error: errorDB } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (errorDB) {
      console.error(errorDB);
      setError("Error obteniendo usuario");
      setLoading(false);
      return;
    }

    if (usuarioDB.rol !== "superadmin") {
      const { data: barberia, error: errorBarberia } = await supabase
        .from("barberias")
        .select("*")
        .eq("id", usuarioDB.barberia_id)
        .single();

      if (errorBarberia) {
        console.error(errorBarberia);
        setError("Error verificando barbería");
        setLoading(false);
        return;
      }

      if (!barberia.activo) {
        setError("Esta barbería está deshabilitada");
        setLoading(false);
        return;
      }
    }

    onLogin(usuarioDB);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0F172A' }}
    >
      {/* Card */}
      <div
        style={{
          width: 360,
          background: '#1E293B',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          padding: '32px 28px',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{ width: 44, height: 44, background: '#2563EB' }}
          >
            <Scissors size={22} color="#ffffff" />
          </div>
          <h1 style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>
            BarberApp
          </h1>
          <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
            Ingresá a tu cuenta
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94A3B8', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="nombre@barberia.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                margin: 0,
                background: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94A3B8', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                margin: 0,
                background: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#F87171', margin: 0, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              margin: '4px 0 0',
              padding: '10px 16px',
              background: loading ? '#1D4ED8' : '#2563EB',
              color: '#ffffff',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  );
}
