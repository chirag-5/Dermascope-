import { useAuth } from '../context/AuthContext';
import PortalSidebar, { ADMIN_NAV_LINKS } from './PortalSidebar';

const PartnerShell = ({ children, wide = false, messaging = false }) => {
  const { user, isAuthenticated } = useAuth();
  const showSidebar = isAuthenticated && user?.role === 'dermatologist';

  return (
    <div className="partner-portal">
      <header className="partner-topbar">
        <div className="partner-topbar-inner">
          <span className="partner-badge">Doctor Portal</span>
          <span className="partner-topbar-label">DermaScope · Dermatologist view</span>
        </div>
      </header>

      <div className={`portal-body ${showSidebar ? 'portal-body-with-sidebar' : ''}`}>
        {showSidebar && <PortalSidebar links={ADMIN_NAV_LINKS} variant="partner" />}

        <div className="portal-main">
          <div
            className={`partner-page-wrap ${wide ? 'partner-page-wrap-wide' : ''} ${
              messaging ? 'partner-page-wrap-messaging' : ''
            }`}
          >
            <div
              className={`container partner-container ${wide ? 'directory-container' : ''} ${
                messaging ? 'partner-container-messaging' : ''
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

export default PartnerShell;
