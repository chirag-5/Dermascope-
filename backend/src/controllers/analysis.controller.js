import { createAnalysis, getAnalysisById } from '../services/analysis.service.js';

export const uploadAnalysis = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const analysis = await createAnalysis(req.user.id, req.file.filename);

    return res.status(201).json(analysis);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAnalysis = async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id, req.user.id);
    return res.json(analysis);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};
