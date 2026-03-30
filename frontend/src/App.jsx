import { useState } from "react";
import Login from "./pages/Login";
import Turnos from "./pages/Turnos";
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <Turnos user={user} onLogout={() => setUser(null)} />;
}

export default App;