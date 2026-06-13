import Analysis from '../models/Analysis.js';
import Booking from '../models/Booking.js';
import Dermatologist from '../models/Dermatologist.js';

const PUBLIC_FIELDS =
  'name email clinicName specialties rating availability consultationPrice role isVerified';

const SKIN_TYPES = new Set(['acne', 'pimples', 'blemishes', 'facial_spots']);
const HAIR_TYPES = new Set(['bald_spots', 'hair_thinning', 'receding_hairline']);

export const buildDermatologistQuery = (filters = {}) => {
  const query = {};

  if (filters.specialty) {
    query.specialties = filters.specialty;
  }

  if (filters.rating) {
    const minRating = Number(filters.rating);
    if (Number.isFinite(minRating)) {
      query.rating = { $gte: minRating };
    }
  }

  if (filters.availability) {
    query.availability = filters.availability;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { clinicName: searchRegex }];
  }

  return query;
};

export const listDermatologists = async (filters = {}) => {
  const query = buildDermatologistQuery(filters);

  const dermatologists = await Dermatologist.find(query)
    .select(PUBLIC_FIELDS)
    .sort({ rating: -1, name: 1 });

  return dermatologists;
};

export const countDermatologists = () => Dermatologist.countDocuments();

const availabilityScore = (availability) => {
  if (availability === 'available') return 2;
  if (availability === 'limited') return 1;
  return 0;
};

export const deriveDiagnosisFromAnalysis = (analysis) => {
  const detections = analysis?.detections || [];
  const categories = new Set(detections.map((d) => d.category));
  const types = [...new Set(detections.map((d) => d.type))];

  const neededSpecialties = [];
  if (categories.has('skin') || types.some((t) => SKIN_TYPES.has(t))) {
    neededSpecialties.push('skin');
  }
  if (categories.has('hair') || types.some((t) => HAIR_TYPES.has(t))) {
    neededSpecialties.push('hair');
  }

  if (neededSpecialties.length === 0) {
    neededSpecialties.push('skin');
  }

  const labels = types.slice(0, 3).map((t) => t.replace(/_/g, ' '));

  return {
    neededSpecialties,
    detectionTypes: types,
    summary:
      labels.length > 0
        ? `Detected: ${labels.join(', ')}`
        : 'General skin & hair consultation',
  };
};

const buildMatchReason = (doctor, neededSpecialties, detectionTypes) => {
  const matched = neededSpecialties.filter((s) => doctor.specialties.includes(s));
  const specialtyText = matched.map((s) => (s === 'skin' ? 'skin' : 'hair')).join(' & ');

  if (detectionTypes.length > 0) {
    return `Recommended for your ${specialtyText} concerns (${detectionTypes
      .slice(0, 2)
      .map((t) => t.replace(/_/g, ' '))
      .join(', ')})`;
  }

  return `Recommended — specializes in ${specialtyText} care`;
};

const scoreDoctor = (doctor, neededSpecialties) => {
  const matchedCount = neededSpecialties.filter((s) =>
    doctor.specialties.includes(s)
  ).length;
  const fullMatch = matchedCount === neededSpecialties.length ? 10 : 0;
  const partialMatch = matchedCount * 5;
  return (
    fullMatch +
    partialMatch +
    doctor.rating * 2 +
    availabilityScore(doctor.availability)
  );
};

export const getRecommendedDermatologists = async (analysisId, userId) => {
  const analysis = await Analysis.findById(analysisId);

  if (!analysis) {
    const error = new Error('Analysis not found');
    error.statusCode = 404;
    throw error;
  }

  if (analysis.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to use this analysis');
    error.statusCode = 403;
    throw error;
  }

  const diagnosis = deriveDiagnosisFromAnalysis(analysis);

  const doctors = await Dermatologist.find({
    availability: { $ne: 'unavailable' },
    specialties: { $in: diagnosis.neededSpecialties },
  })
    .select(PUBLIC_FIELDS)
    .lean();

  const ranked = doctors
    .map((doctor) => ({
      ...doctor,
      recommended: true,
      matchScore: scoreDoctor(doctor, diagnosis.neededSpecialties),
      matchReason: buildMatchReason(
        doctor,
        diagnosis.neededSpecialties,
        diagnosis.detectionTypes
      ),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return { diagnosis, recommended: ranked };
};

const formatSlotLabel = (date) =>
  date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const getDoctorTimeSlots = async (dermatologistId) => {
  const dermatologist = await Dermatologist.findById(dermatologistId);

  if (!dermatologist) {
    const error = new Error('Dermatologist not found');
    error.statusCode = 404;
    throw error;
  }

  if (dermatologist.availability === 'unavailable') {
    return [];
  }

  const slots = [];
  const now = new Date();
  const slotHours = [9, 10, 11, 14, 15, 16, 17];

  for (let dayOffset = 1; dayOffset <= 7; dayOffset += 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + dayOffset);

    if (day.getDay() === 0) {
      continue;
    }

    for (const hour of slotHours) {
      const slotDate = new Date(day);
      slotDate.setHours(hour, 0, 0, 0);
      slots.push({
        scheduledAt: slotDate.toISOString(),
        label: formatSlotLabel(slotDate),
      });
    }
  }

  const scheduledTimes = slots.map((s) => new Date(s.scheduledAt));
  const booked = await Booking.find({
    dermatologistId,
    scheduledAt: { $in: scheduledTimes },
    status: { $ne: 'completed' },
  }).select('scheduledAt');

  const bookedSet = new Set(booked.map((b) => b.scheduledAt.getTime()));

  return slots.filter((slot) => !bookedSet.has(new Date(slot.scheduledAt).getTime()));
};
