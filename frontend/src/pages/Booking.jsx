import { useEffect, useMemo, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { bookingService } from '../services/bookingService';

import UserShell from '../components/UserShell';

import { getImageUrl } from '../services/analysisService';



const formatDetectionType = (type) =>

  type

    .split('_')

    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))

    .join(' ');



const formatDateTime = (dateString) => {

  if (!dateString) return 'Not scheduled';

  return new Date(dateString).toLocaleString(undefined, {

    weekday: 'long',

    year: 'numeric',

    month: 'long',

    day: 'numeric',

    hour: 'numeric',

    minute: '2-digit',

  });

};



const Booking = () => {

  const { bookingId } = useParams();

  const { logout } = useAuth();



  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');



  useEffect(() => {

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



    fetchBooking();

  }, [bookingId]);



  const groupedDetections = useMemo(() => {

    if (!booking?.analysis?.detections?.length) {

      return {};

    }



    return booking.analysis.detections.reduce((groups, detection) => {

      const category = detection.category;

      if (!groups[category]) groups[category] = [];

      groups[category].push(detection);

      return groups;

    }, {});

  }, [booking]);



  if (loading) {

    return (

      <UserShell size="medium">

        <p className="subtitle">Loading consultation...</p>

      </UserShell>

    );

  }



  if (error) {

    return (

      <UserShell size="medium">

        <div className="error">{error}</div>

        <p className="link-row">

          <Link to="/upload">Back to home</Link>

        </p>

      </UserShell>

    );

  }



  return (

    <UserShell size="medium">

      <div className="page-header">

        <h1>Your Consultation</h1>

        <button type="button" className="btn-user-muted" onClick={logout}>

          Logout

        </button>

      </div>



      <div className="forward-notice">

        Your annotated image and analysis were automatically forwarded to{' '}

        <strong>{booking.dermatologist?.name}</strong>. Open Messages to chat with your doctor

        about your results and appointment.

      </div>



      <div className="booking-summary">

        <p>

          <strong>Doctor:</strong> {booking.dermatologist?.name}

        </p>

        <p>

          <strong>Clinic:</strong>{' '}

          {booking.dermatologist?.clinicName || 'Independent practice'}

        </p>

        <p>

          <strong>Appointment:</strong> {formatDateTime(booking.scheduledAt)}

        </p>

        <div className={`status-badge status-booking-${booking.status}`}>

          Status: {booking.status}

        </div>

        {booking.status === 'declined' && (
          <p className="subtitle consultation-declined-user">
            The doctor declined this consultation request. You can book another dermatologist.
          </p>
        )}

      </div>



      {booking.status !== 'declined' && (
      <p className="link-row">
        <Link to={`/consultations/${bookingId}`} className="btn-user btn-user-inline btn-as-link">
          Open messages
        </Link>
      </p>
      )}



      {booking.analysis && (

        <>

          <div className={`status-badge status-${booking.analysis.status}`}>

            Analysis forwarded: {booking.analysis.status}

          </div>



          <div className="result-section">

            <h2>Original Image</h2>

            <img

              src={getImageUrl(booking.analysis.originalImage)}

              alt="Original uploaded image"

              className="result-image"

            />

          </div>



          {booking.analysis.annotatedImage && (

            <div className="result-section">

              <h2>Annotated Image (shared with doctor)</h2>

              <img

                src={getImageUrl(booking.analysis.annotatedImage)}

                alt="Annotated image with detected regions"

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

        <Link to="/dermatologists">Find another dermatologist</Link>

      </p>

    </UserShell>

  );

};



export default Booking;

