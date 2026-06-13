const MessengerLayout = ({
  sidebarTitle,
  sidebar,
  children,
  showChat = false,
  onBack,
  backLabel = 'Back',
}) => {
  return (
    <div className={`messenger-layout ${showChat ? 'messenger-show-chat' : ''}`}>
      <aside className="messenger-sidebar">
        {sidebarTitle && <h2 className="messenger-sidebar-title">{sidebarTitle}</h2>}
        {sidebar}
      </aside>

      <main className="messenger-main">
        {showChat && onBack && (
          <button type="button" className="messenger-back-btn" onClick={onBack}>
            ← {backLabel}
          </button>
        )}
        {children}
      </main>
    </div>
  );
};

export default MessengerLayout;
