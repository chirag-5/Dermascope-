import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisService, getImageUrl } from '../services/analysisService';
import UserShell from '../components/UserShell';

const formatDetectionType = (type) =>
  type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const Results = () => {
  const { analysisId } = useParams();
  const { logout } = useAuth();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await analysisService.getById(analysisId);
        setAnalysis(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  const groupedDetections = useMemo(() => {
    if (!analysis?.detections?.length) {
      return {};
    }

    return analysis.detections.reduce((groups, detection) => {
      const category = detection.category;

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(detection);
      return groups;
    }, {});
  }, [analysis]);

  if (loading) {
    return (
      <UserShell size="medium">
        <p className="subtitle">Loading results...</p>
      </UserShell>
    );
  }

  if (error) {
    return (
      <UserShell size="medium">
        <div className="error">{error}</div>
        <p className="link-row">
          <Link to="/upload">Back to upload</Link>
        </p>
      </UserShell>
    );
  }

  return (
    <UserShell size="medium">
      <div className="page-header">
        <h1>Your Analysis</h1>
        <button type="button" className="btn-user-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <p className="user-results-intro">
        Here&apos;s what our AI found. Highlighted regions show areas on your skin or hair that
        may benefit from a closer look. When you&apos;re ready, connect with a dermatologist —
        your results go with you automatically.
      </p>

      <div className={`status-badge status-${analysis.status}`}>
        Status: {analysis.status}
      </div>

      {analysis.status === 'failed' && analysis.failureReason && (
        <div className="error">{analysis.failureReason}</div>
      )}

      <div className="result-section">
        <h2>Original Image</h2>
        <img
          src={getImageUrl(analysis.originalImage)}
          alt="Original uploaded image"
          className="result-image"
        />
      </div>

      {analysis.annotatedImage && (
        <div className="result-section">
          <h2>Annotated Image</h2>
          <img
            src={getImageUrl(analysis.annotatedImage)}
            alt="Annotated image with detected regions"
            className="result-image"
          />
        </div>
      )}

      <div className="result-section">
        <h2>Detected Regions</h2>

        {analysis.detections?.length > 0 ? (
          Object.entries(groupedDetections).map(([category, detections]) => (
            <div key={category} className="detection-group">
              <div className={`category-badge category-${category}`}>{category}</div>

              <div className="detection-cards">
                {detections.map((detection) => (
                  <div key={`${detection.type}-${detection.x}-${detection.y}`} className="detection-card">
                    <span className="detection-type">{formatDetectionType(detection.type)}</span>
                    <span className="detection-coords">
                      x:{detection.x} y:{detection.y} · {detection.width}×{detection.height}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="subtitle">No regions detected.</p>
        )}
      </div>

      <p className="subtitle">
        Visual guidance only — not a medical diagnosis. Always consult a professional for
        treatment decisions.
      </p>

      <div className="find-doctor-cta">
        <p className="find-doctor-cta-text">
          Ready for expert advice? Find a dermatologist and share this analysis in one tap.
        </p>
        <Link to={`/dermatologists?analysisId=${analysisId}`} className="btn-find-doctor">
          Find a Dermatologist
        </Link>
      </div>

      <p className="link-row">
        <Link to="/upload">Upload another image</Link>
      </p>
    </UserShell>
  );
};

export default Results;
