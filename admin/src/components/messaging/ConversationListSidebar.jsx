import { Link } from 'react-router-dom';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const ConversationListSidebar = ({
  loading,
  error,
  activeSections,
  activeId,
  basePath,
  emptyMessage = 'No conversations yet',
}) => {
  if (loading) {
    return <p className="messenger-list-empty">Loading...</p>;
  }

  if (error) {
    return <p className="messenger-list-error">{error}</p>;
  }

  const hasItems = activeSections.some((section) => section.items.length > 0);

  if (!hasItems) {
    return <p className="messenger-list-empty">{emptyMessage}</p>;
  }

  return (
    <>
      {activeSections.map((section) => (
        <section key={section.title} className="messenger-list-section">
          <h3>{section.title}</h3>
          {section.items.length === 0 ? (
            <p className="messenger-list-empty">{section.emptyLabel}</p>
          ) : (
            section.items.map((item) => (
              <Link
                key={item.id}
                to={`${basePath}/${item.id}`}
                className={`messenger-list-item ${
                  item.id === activeId ? 'messenger-list-item-active' : ''
                }`}
              >
                <span className="messenger-list-name">{item.title}</span>
                {item.subtitle && (
                  <span className="messenger-list-meta">{item.subtitle}</span>
                )}
              </Link>
            ))
          )}
        </section>
      ))}
    </>
  );
};

export { formatDate };
export default ConversationListSidebar;
