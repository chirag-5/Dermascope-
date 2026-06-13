import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dermatologistService } from '../services/dermatologistService';
import UserShell from '../components/UserShell';
import BookConsultationModal from '../components/BookConsultationModal';

const formatPrice = (price) => (price ? `₹${price}` : 'Contact clinic');

const formatAvailability = (availability) =>
  availability.charAt(0).toUpperCase() + availability.slice(1);

const DoctorCard = ({ doctor, analysisId, onBook, bookingDoctorId, recommended = false }) => (
  <article className={`dermatologist-card ${recommended ? 'dermatologist-card-recommended' : ''}`}>
    {recommended && <span className="recommended-tag">Recommended</span>}

    <div className="dermatologist-card-header">
      <h2>{doctor.name}</h2>
      <span className="rating-badge">★ {doctor.rating.toFixed(1)}</span>
    </div>

    {doctor.matchReason && <p className="recommended-reason">{doctor.matchReason}</p>}

    <p className="clinic-name">{doctor.clinicName || 'Independent practice'}</p>

    <p className="doctor-meta">
      <span>{formatPrice(doctor.consultationPrice)}</span>
      <span>{formatAvailability(doctor.availability)}</span>
    </p>

    <div className="specialty-tags">
      {doctor.specialties.map((item) => (
        <span key={item} className={`category-badge category-${item}`}>
          {item}
        </span>
      ))}
    </div>

    <button
      type="button"
      className="btn-card btn-user"
      disabled={!analysisId || bookingDoctorId === doctor._id}
      onClick={() => onBook(doctor)}
    >
      {bookingDoctorId === doctor._id ? 'Loading...' : 'Book Consultation'}
    </button>
  </article>
);

const Dermatologists = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  const [dermatologists, setDermatologists] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [diagnosisSummary, setDiagnosisSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [availability, setAvailability] = useState('');
  const [rating, setRating] = useState('');

  useEffect(() => {
    if (!analysisId) return;

    const fetchRecommended = async () => {
      try {
        const { data } = await dermatologistService.getRecommended(analysisId);
        setRecommended(data.recommended || []);
        setDiagnosisSummary(data.diagnosis?.summary || '');
      } catch {
        setRecommended([]);
      }
    };

    fetchRecommended();
  }, [analysisId]);

  useEffect(() => {
    const fetchDermatologists = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (specialty) params.specialty = specialty;
        if (availability) params.availability = availability;
        if (rating) params.rating = rating;

        const { data } = await dermatologistService.list(params);
        setDermatologists(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dermatologists');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchDermatologists, 300);
    return () => clearTimeout(debounce);
  }, [search, specialty, availability, rating]);

  const handleOpenBooking = (doctor) => {
    if (!analysisId) {
      setBookingError('An analysis is required before booking. Upload an image first.');
      return;
    }
    setBookingError('');
    setBookingDoctorId(doctor._id);
    setSelectedDoctor(doctor);
  };

  const handleBooked = (booking) => {
    setSelectedDoctor(null);
    setBookingDoctorId(null);
    navigate(`/booking/${booking._id}`);
  };

  const recommendedIds = new Set(recommended.map((d) => d._id));
  const otherDoctors = dermatologists.filter((d) => !recommendedIds.has(d._id));

  return (
    <UserShell size="wide">
      <div className="page-header">
        <h1>Find a Dermatologist</h1>
        <button type="button" className="btn-user-muted" onClick={logout}>
          Logout
        </button>
      </div>

      {analysisId && (
        <>
          <p className="subtitle">
            Based on your analysis.{' '}
            <Link to={`/results/${analysisId}`}>Back to results</Link>
          </p>
          {diagnosisSummary && (
            <div className="diagnosis-banner">
              <strong>Your analysis:</strong> {diagnosisSummary}
            </div>
          )}
          <div className="forward-notice">
            When you book, your annotated image and detections are sent to the doctor
            automatically — no re-upload.
          </div>
        </>
      )}

      {analysisId && recommended.length > 0 && (
        <section className="recommended-section">
          <h2>Recommended for you</h2>
          <p className="subtitle">Matched to your detected skin &amp; hair concerns</p>
          <div className="dermatologist-grid">
            {recommended.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                analysisId={analysisId}
                onBook={handleOpenBooking}
                bookingDoctorId={bookingDoctorId}
                recommended
              />
            ))}
          </div>
        </section>
      )}

      <div className="filters-panel">
        <div className="form-group">
          <label htmlFor="search">Search by name or clinic</label>
          <input
            id="search"
            type="text"
            placeholder="e.g. Dr. Sharma or Glow Skin"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="form-group">
            <label htmlFor="specialty">Specialty</label>
            <select id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">All specialties</option>
              <option value="skin">Skin</option>
              <option value="hair">Hair</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <select
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">Any availability</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rating">Minimum rating</label>
            <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">Any rating</option>
              <option value="4.5">4.5+</option>
              <option value="4">4.0+</option>
              <option value="3.5">3.5+</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="subtitle">Loading dermatologists...</p>}
      {error && <div className="error">{error}</div>}
      {bookingError && <div className="error">{bookingError}</div>}

      {!analysisId && (
        <p className="subtitle">
          Upload and analyze an image first to get recommendations and book with your results
          attached.
        </p>
      )}

      {!loading && !error && otherDoctors.length > 0 && (
        <section>
          <h2>All dermatologists</h2>
          <div className="dermatologist-grid">
            {otherDoctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                analysisId={analysisId}
                onBook={handleOpenBooking}
                bookingDoctorId={bookingDoctorId}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && dermatologists.length === 0 && recommended.length === 0 && (
        <p className="subtitle">No dermatologists match your filters.</p>
      )}

      <p className="link-row">
        <Link to={analysisId ? `/results/${analysisId}` : '/upload'}>
          {analysisId ? 'Back to results' : 'Back to home'}
        </Link>
      </p>

      {selectedDoctor && analysisId && (
        <BookConsultationModal
          doctor={selectedDoctor}
          analysisId={analysisId}
          onClose={() => {
            setSelectedDoctor(null);
            setBookingDoctorId(null);
          }}
          onBooked={handleBooked}
        />
      )}
    </UserShell>
  );
};

export default Dermatologists;
