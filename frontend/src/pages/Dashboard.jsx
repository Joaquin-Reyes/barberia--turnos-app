import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: 'turnos', label: 'Turnos' },
  { to: 'barberos', label: 'Barberos' },
  { to: 'facturacion', label: 'Facturación' },
  { to: 'configuracion', label: 'Configuración' },
]

function Dashboard({ user, onLogout }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f7fb' }}>
      <aside style={{
        width: '200px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>BarberApp</p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Panel de gestión</p>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: isActive ? '500' : '400',
                background: isActive ? '#f3f4f6' : 'transparent',
                color: isActive ? '#111827' : '#6b7280',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 6px' }}>{user?.email}</p>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              padding: 0,
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard