import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const links = [
  { to: '/', label: 'Today', end: true },
  { to: '/log', label: 'Log' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/routine', label: 'Routine' },
  { to: '/progress', label: 'Progress' },
  { to: '/weight', label: 'Weight' },
]

export function Layout() {
  const { activeProfile } = useApp()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">Iron Log</div>
          <div className="brand-sub">Strength sessions, kept local</div>
        </div>
        {activeProfile && (
          <NavLink to="/profiles" className="profile-chip">
            <span aria-hidden>◉</span>
            <span>{activeProfile.name}</span>
          </NavLink>
        )}
      </header>

      {activeProfile && (
        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
