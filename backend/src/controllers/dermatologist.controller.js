import {
  getRecommendedDermatologists,
  getDoctorTimeSlots,
  listDermatologists,
} from '../services/dermatologist.service.js';

const handleError = (res, error) =>
  res.status(error.statusCode || 500).json({ message: error.message });

export const getDermatologists = async (req, res) => {
  try {
    const { specialty, rating, availability, search } = req.query;

    const dermatologists = await listDermatologists({
      specialty,
      rating,
      availability,
      search,
    });

    return res.json(dermatologists);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRecommended = async (req, res) => {
  try {
    const { analysisId } = req.query;

    if (!analysisId) {
      return res.status(400).json({ message: 'analysisId is required' });
    }

    const result = await getRecommendedDermatologists(analysisId, req.user.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTimeSlots = async (req, res) => {
  try {
    const slots = await getDoctorTimeSlots(req.params.id);
    return res.json(slots);
  } catch (error) {
    return handleError(res, error);
  }
};
