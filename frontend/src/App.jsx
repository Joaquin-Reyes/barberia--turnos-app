import { useState } from "react";
import Login from "./pages/Login";
import Turnos from "./pages/Turnos";
import SuperAdminPanel from "./pages/SuperAdminPanel"; // 👈 NUEVO
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 🔥 NUEVA LÓGICA
  if (user.rol === "superadmin") {
    return (
      <SuperAdminPanel
        user={user}
        onLogout={() => setUser(null)}
      />
    );
  }

  return (
    <Turnos
      user={user}
      onLogout={() => setUser(null)}
    />
  );
}

export default App;