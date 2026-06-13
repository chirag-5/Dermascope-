import { useEffect, useMemo, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { bookingService } from '../services/bookingService';

import { getImageUrl } from '../services/analysisService';

import PartnerShell from '../components/PartnerShell';



const formatDetectionType = (type) =>

  type

    .split('_')

    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))

    .join(' ');



const formatDate = (dateString) =>

  new Date(dateString).toLocaleDateString(undefined, {

    year: 'numeric',

    month: 'long',

    day: 'numeric',

  });



const PartnerBookingDetail = () => {

  const { bookingId } = useParams();

  const { logout } = useAuth();



  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [statusUpdating, setStatusUpdating] = useState(false);



  const fetchBooking = async () => {

    setLoading(true);

    setError('');



    try {

      const { data } = await bookingService.getById(bookingId);

      setBooking(data);

    } catch (err) {

      setError(err.response?.data?.message || 'Failed to load booking');

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchBooking();

  }, [bookingId]);



  const groupedDetections = useMemo(() => {

    if (!booking?.analysis?.detections?.length) {

      return {};

    }



    return booking.analysis.detections.reduce((groups, detection) => {

      const category = detection.category;



      if (!groups[category]) {

        groups[category] = [];

      }



      groups[category].push(detection);

      return groups;

    }, {});

  }, [booking]);



  const handleStatusUpdate = async (status) => {

    setStatusUpdating(true);

    setError('');



    try {

      const { data } = await bookingService.updateStatus(bookingId, status);

      setBooking(data);

    } catch (err) {

      setError(err.response?.data?.message || 'Failed to update consultation status');

    } finally {

      setStatusUpdating(false);

    }

  };



  if (loading) {

    return (

      <PartnerShell wide>

        <p className="subtitle">Loading consultation...</p>

      </PartnerShell>

    );

  }



  if (error && !booking) {

    return (

      <PartnerShell wide>

        <div className="error">{error}</div>

        <p className="link-row">

          <Link to="/dashboard">Back to dashboard</Link>

        </p>

      </PartnerShell>

    );

  }



  return (

    <PartnerShell wide>

      <div className="page-header">

        <h1>Patient Consultation</h1>

        <button type="button" className="btn-partner-muted" onClick={logout}>

          Logout

        </button>

      </div>



      <div className="booking-summary">

        <p>

          <strong>Patient:</strong> {booking.user?.name}

        </p>

        <p>

          <strong>Email:</strong> {booking.user?.email}

        </p>

        <p>

          <strong>Consultation date:</strong> {formatDate(booking.createdAt)}

        </p>

        {booking.scheduledAt && (

          <p>

            <strong>Appointment:</strong>{' '}

            {new Date(booking.scheduledAt).toLocaleString(undefined, {

              weekday: 'long',

              month: 'long',

              day: 'numeric',

              hour: 'numeric',

              minute: '2-digit',

            })}

          </p>

        )}

        <div className={`status-badge status-booking-${booking.status}`}>

          Status: {booking.status}

        </div>

      </div>



      {error && <div className="error">{error}</div>}

      {booking.status === 'pending' && (
        <div className="consultation-request-card">
          <h2>Consultation request</h2>
          <p className="consultation-request-name">{booking.user?.name || 'Patient'}</p>
          <p className="consultation-request-text">
            has requested a consultation with you.
          </p>
          {booking.scheduledAt && (
            <p className="consultation-request-slot">
              <strong>Requested slot:</strong>{' '}
              {new Date(booking.scheduledAt).toLocaleString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
          <div className="consultation-request-actions">
            <button
              type="button"
              className="btn-partner btn-partner-inline"
              disabled={statusUpdating}
              onClick={() => handleStatusUpdate('active')}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn-partner-muted btn-decline"
              disabled={statusUpdating}
              onClick={() => handleStatusUpdate('declined')}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {booking.status === 'declined' && (
        <div className="consultation-declined-notice">
          You declined this consultation request from {booking.user?.name || 'the patient'}.
        </div>
      )}

      {booking.status === 'active' && (
        <div className="consultation-actions">
          <Link
            to={`/consultations/${bookingId}`}
            className="btn-partner btn-partner-inline btn-as-link"
          >
            Message {booking.user?.name || 'patient'}
          </Link>
          <button
            type="button"
            className="btn-partner-muted"
            disabled={statusUpdating}
            onClick={() => handleStatusUpdate('completed')}
          >
            Mark as Complete
          </button>
        </div>
      )}

      {booking.status === 'completed' && (
        <p className="subtitle">This consultation is archived under Past consultations.</p>
      )}



      {booking.analysis && (

        <>

          <div className="forward-notice">

            Patient analysis (original + annotated images and detections) was forwarded

            automatically with this booking.

          </div>



          <div className={`status-badge status-${booking.analysis.status}`}>

            Analysis status: {booking.analysis.status}

          </div>



          <div className="result-section">

            <h2>Original Image</h2>

            <img

              src={getImageUrl(booking.analysis.originalImage)}

              alt="Patient original image"

              className="result-image"

            />

          </div>



          {booking.analysis.annotatedImage && (

            <div className="result-section">

              <h2>Annotated Image</h2>

              <img

                src={getImageUrl(booking.analysis.annotatedImage)}

                alt="Patient annotated image"

                className="result-image"

              />

            </div>

          )}



          <div className="result-section">

            <h2>Detected Regions</h2>



            {booking.analysis.detections?.length > 0 ? (

              Object.entries(groupedDetections).map(([category, detections]) => (

                <div key={category} className="detection-group">

                  <div className={`category-badge category-${category}`}>{category}</div>



                  <div className="detection-cards">

                    {detections.map((detection) => (

                      <div

                        key={`${detection.type}-${detection.x}-${detection.y}`}

                        className="detection-card"

                      >

                        <span className="detection-type">

                          {formatDetectionType(detection.type)}

                        </span>

                        <span className="detection-coords">

                          x:{detection.x} y:{detection.y} · {detection.width}×

                          {detection.height}

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

        </>

      )}



      <p className="link-row">

        <Link to="/dashboard">Back to dashboard</Link>

      </p>

    </PartnerShell>

  );

};



export default PartnerBookingDetail;

