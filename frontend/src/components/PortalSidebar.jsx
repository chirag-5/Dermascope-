import { NavLink } from 'react-router-dom';

export const USER_NAV_LINKS = [
  { to: '/upload', label: 'Home', end: true },
  { to: '/consultations', label: 'Messages', end: false },
  { to: '/support', label: 'Help', end: false },
];

const PortalSidebar = ({ links, variant = 'user' }) => {
  return (
    <aside className={`portal-sidebar portal-sidebar-${variant}`}>
      <nav className="portal-sidebar-nav" aria-label="Main navigation">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `portal-sidebar-link ${isActive ? 'portal-sidebar-link-active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default PortalSidebar;
