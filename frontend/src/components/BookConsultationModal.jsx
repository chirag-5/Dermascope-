import { useEffect, useState } from 'react';
import { dermatologistService } from '../services/dermatologistService';
import { bookingService } from '../services/bookingService';

const BookConsultationModal = ({ doctor, analysisId, onClose, onBooked }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError('');

      try {
        const { data } = await dermatologistService.getSlots(doctor._id);
        setSlots(data);
        if (data.length > 0) {
          setSelectedSlot(data[0].scheduledAt);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load time slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [doctor._id]);

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data } = await bookingService.create({
        dermatologistId: doctor._id,
        analysisId,
        scheduledAt: selectedSlot,
      });
      onBooked(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="book-modal-title"
      >
        <h2 id="book-modal-title">Book with {doctor.name}</h2>
        <p className="subtitle">{doctor.clinicName}</p>

        <div className="forward-notice">
          Your annotated image and full analysis will be sent to this doctor automatically —
          no re-upload needed.
        </div>

        {doctor.matchReason && (
          <p className="recommended-reason">{doctor.matchReason}</p>
        )}

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="time-slot">Choose a time slot</label>
          {loadingSlots ? (
            <p className="subtitle">Loading available slots...</p>
          ) : slots.length === 0 ? (
            <p className="subtitle">No slots available. Try another doctor.</p>
          ) : (
            <select
              id="time-slot"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              {slots.map((slot) => (
                <option key={slot.scheduledAt} value={slot.scheduledAt}>
                  {slot.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-user-muted" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-user"
            disabled={submitting || !selectedSlot || slots.length === 0}
            onClick={handleConfirm}
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookConsultationModal;
