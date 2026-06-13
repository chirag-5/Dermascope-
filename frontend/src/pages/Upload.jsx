import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisService } from '../services/analysisService';
import UserShell from '../components/UserShell';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024;

const STEPS = [
  {
    step: '1',
    title: 'Upload a photo',
    text: 'Share a clear image of your face or scalp.',
  },
  {
    step: '2',
    title: 'AI highlights areas',
    text: 'Our AI marks skin and hair regions that may need attention.',
  },
  {
    step: '3',
    title: 'Connect with a doctor',
    text: 'Book a dermatologist and share your results automatically.',
  },
];

const Upload = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const validateFile = (selectedFile) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      return 'Only JPG, JPEG, and PNG images are allowed';
    }

    if (selectedFile.size > MAX_SIZE) {
      return 'File size must not exceed 10MB';
    }

    return '';
  };

  const setSelectedFile = (selectedFile) => {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview('');
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      setSelectedFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const selectedFile = e.dataTransfer.files?.[0];

    if (selectedFile) {
      setSelectedFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { data } = await analysisService.uploadImage(file);
      navigate(`/results/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <UserShell size="medium">
      <div className="page-header">
        <h1>Home</h1>
        <button type="button" className="btn-user-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="user-hero">
        <p className="user-hero-eyebrow">AI-powered Skin &amp; Hair Analysis</p>
        <h2 className="user-hero-title">Hi {user?.name?.split(' ')[0] || 'there'}, welcome to DermaScope</h2>
        <p className="user-hero-text">
          We help you understand potential problem areas on your skin and hair, then connect
          you with dermatologists who can review your results — no repeat uploads needed.
        </p>
      </div>

      <div className="user-steps">
        <h3 className="user-steps-heading">How it works</h3>
        <div className="user-steps-grid">
          {STEPS.map((item) => (
            <div key={item.step} className="user-step-card">
              <span className="user-step-number">{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="user-upload-section">
        <h3>Start your analysis</h3>
        <p className="subtitle">
          Use a well-lit photo showing your face or scalp. This is for visual guidance only —
          not a medical diagnosis.
        </p>

        {error && <div className="error">{error}</div>}

        <div
          className={`dropzone ${dragging ? 'dropzone-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFileChange}
            hidden
          />

          {preview ? (
            <img src={preview} alt="Preview" className="preview-image" />
          ) : (
            <div className="dropzone-placeholder">
              <p className="dropzone-title">Drop your photo here</p>
              <p className="dropzone-sub">or click to browse</p>
            </div>
          )}
        </div>

        <p className="file-hint">JPG or PNG · max 10MB</p>

        <button type="button" className="btn-user" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Analyzing your photo...' : 'Analyze My Photo'}
        </button>
      </div>
    </UserShell>
  );
};

export default Upload;
