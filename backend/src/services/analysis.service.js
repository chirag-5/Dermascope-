import Analysis from '../models/Analysis.js';
import { generateAnnotatedImage } from './annotation.service.js';

export const createAnalysis = async (userId, filename) => {
  const originalImage = `/uploads/${filename}`;

  const analysis = await Analysis.create({
    userId,
    originalImage,
    annotatedImage: null,
    detections: [],
    status: 'processing',
    failureReason: null,
  });

  try {
    const { detections, annotatedImage } = await generateAnnotatedImage(filename);

    analysis.annotatedImage = annotatedImage;
    analysis.detections = detections;
    analysis.status = 'completed';
    analysis.failureReason = null;
    await analysis.save();
  } catch (error) {
    console.error('[Analysis] Annotation failed:', error.message);
    analysis.status = 'failed';
    analysis.failureReason = error.message;
    await analysis.save();
  }

  return analysis;
};

export const getAnalysisById = async (analysisId, userId) => {
  const analysis = await Analysis.findById(analysisId);

  if (!analysis) {
    const error = new Error('Analysis not found');
    error.statusCode = 404;
    throw error;
  }

  if (analysis.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to view this analysis');
    error.statusCode = 403;
    throw error;
  }

  return analysis;
};
