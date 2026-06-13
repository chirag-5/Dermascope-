import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImage, isServiceEnabled } from './anthropic.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

const resolveAnnotatedExtension = (mimeType, originalExt) => {
  if (mimeType === 'image/jpeg') {
    return '.jpg';
  }

  if (mimeType === 'image/png') {
    return '.png';
  }

  return originalExt;
};

export const generateAnnotatedImage = async (originalFilename) => {
  if (!isServiceEnabled()) {
    throw new Error('Annotation service is disabled. Set ANTHROPIC_API_KEY in backend/.env.');
  }

  const { detections, annotatedImageBuffer, annotatedMimeType } =
    await analyzeImage(originalFilename);

  const originalExt = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, originalExt);
  const annotatedExt = resolveAnnotatedExtension(annotatedMimeType, originalExt);
  const annotatedFilename = `${baseName}-annotated${annotatedExt}`;
  const annotatedPath = path.join(uploadsDir, annotatedFilename);

  fs.writeFileSync(annotatedPath, annotatedImageBuffer);

  return {
    detections,
    annotatedImage: `/uploads/${annotatedFilename}`,
  };
};
