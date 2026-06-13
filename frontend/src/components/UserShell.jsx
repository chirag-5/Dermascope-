import { useAuth } from '../context/AuthContext';
import PortalSidebar, { USER_NAV_LINKS } from './PortalSidebar';

const UserShell = ({ children, size = 'default', messaging = false }) => {
  const { user, isAuthenticated } = useAuth();
  const showSidebar = isAuthenticated && user?.role === 'user';

  const sizeClass =
    size === 'wide' ? 'directory-container' : size === 'medium' ? 'user-container-medium' : '';

  return (
    <div className="user-portal">
      <header className="user-topbar">
        <div className="user-topbar-inner">
          <span className="user-badge">User Portal</span>
          <span className="user-topbar-label">DermaScope · AI Skin &amp; Hair Analysis</span>
        </div>
      </header>

      <div className={`portal-body ${showSidebar ? 'portal-body-with-sidebar' : ''}`}>
        {showSidebar && <PortalSidebar links={USER_NAV_LINKS} variant="user" />}

        <div className="portal-main">
          <div
            className={`user-page-wrap ${sizeClass ? 'user-page-wrap-sized' : ''} ${
              messaging ? 'user-page-wrap-messaging' : ''
            }`}
          >
            <div
              className={`container user-container ${sizeClass} ${
                messaging ? 'user-container-messaging' : ''
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserShell;
