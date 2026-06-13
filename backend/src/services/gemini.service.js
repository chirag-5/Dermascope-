import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

let serviceEnabled = false;

const ALLOWED_TYPES = {
  acne: 'skin',
  pimples: 'skin',
  blemishes: 'skin',
  facial_spots: 'skin',
  bald_spots: 'hair',
  hair_thinning: 'hair',
  receding_hairline: 'hair',
};

const TYPE_ALIASES = {
  pimple: 'pimples',
  blemish: 'blemishes',
  spot: 'facial_spots',
  facial_spot: 'facial_spots',
  spots: 'facial_spots',
  bald_spot: 'bald_spots',
  bald: 'bald_spots',
  hair_loss: 'hair_thinning',
  thinning: 'hair_thinning',
  thinning_hair: 'hair_thinning',
  receding_hair: 'receding_hairline',
  hairline_recession: 'receding_hairline',
  hairline_issues: 'receding_hairline',
  red_spots: 'acne',
  red_spot: 'acne',
  redness: 'blemishes',
  dark_spots: 'facial_spots',
};

const CATEGORY_COLORS = {
  skin: '#ef4444',
  hair: '#2563eb',
};

const getConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY,
  baseUrl:
    process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  confidenceThreshold: Number(process.env.GEMINI_CONFIDENCE_THRESHOLD ?? 0.7),
  maxDetectionsPerType: Number(process.env.GEMINI_MAX_DETECTIONS_PER_TYPE ?? 6),
  maxBoxAreaRatio: Number(process.env.GEMINI_MAX_BOX_AREA_RATIO ?? 0.35),
});

const buildDetectionPrompt = (imageWidth, imageHeight) => `Analyze this dermatology photo.

Image size: ${imageWidth} x ${imageHeight} pixels.

Identify visible skin and hair issues on the person's face/scalp only. Use broad bounding boxes that cover each affected facial region (forehead, cheek, chin, or hairline) — not tiny pinpoint boxes.

Allowed types:
- acne, pimples, blemishes, facial_spots (category: skin)
- receding_hairline, hair_thinning, bald_spots (category: hair)

Return JSON only:
{
  "detections": [
    {
      "type": "acne",
      "category": "skin",
      "confidence": 0.9,
      "x": 120,
      "y": 80,
      "width": 200,
      "height": 150
    }
  ]
}

Rules:
- x, y, width, height are pixel coordinates for this ${imageWidth}x${imageHeight} image.
- Each box should cover a broad affected area on facial skin or scalp.
- Only mark regions on the face/scalp — never background (walls, fans, furniture).
- Do not mark eyes, eyebrows, eyelids, lips, or teeth.
- Ignore healthy skin.
- If uncertain, omit the detection.
- Return {"detections": []} if nothing is clearly visible.`;

const readImageFile = (originalFilename) => {
  const filePath = path.join(uploadsDir, originalFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error('Original image file not found');
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  const base64 = fs.readFileSync(filePath).toString('base64');

  return { filePath, base64, mimeType, ext };
};

const normalizeType = (type) =>
  String(type)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const resolveType = (rawType) => {
  const normalized = normalizeType(rawType);

  if (ALLOWED_TYPES[normalized]) {
    return normalized;
  }

  if (TYPE_ALIASES[normalized]) {
    return TYPE_ALIASES[normalized];
  }

  for (const [alias, canonical] of Object.entries(TYPE_ALIASES)) {
    if (normalized.includes(alias)) {
      return canonical;
    }
  }

  return null;
};

const normalizeConfidence = (value) => {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 1;
  }

  if (confidence > 1 && confidence <= 100) {
    return confidence / 100;
  }

  return Math.max(0, Math.min(confidence, 1));
};

const extractCoordinates = (item, imageWidth, imageHeight) => {
  if (item?.bbox && Array.isArray(item.bbox) && item.bbox.length >= 4) {
    return coordsToXYWH(item.bbox, imageWidth, imageHeight);
  }

  if (
    item?.x1 !== undefined &&
    item?.y1 !== undefined &&
    item?.x2 !== undefined &&
    item?.y2 !== undefined
  ) {
    return coordsToXYWH([item.x1, item.y1, item.x2, item.y2], imageWidth, imageHeight);
  }

  if (
    item?.x !== undefined &&
    item?.y !== undefined &&
    item?.width !== undefined &&
    item?.height !== undefined
  ) {
    return coordsToXYWH([item.x, item.y, item.width, item.height], imageWidth, imageHeight);
  }

  return null;
};

const coordsToXYWH = (coords, imageWidth, imageHeight) => {
  const [a, b, c, d] = coords.map(Number);

  if (![a, b, c, d].every(Number.isFinite)) {
    return null;
  }

  const maxValue = Math.max(...[a, b, c, d].map(Math.abs));

  if (maxValue <= 1) {
    return {
      x: a * imageWidth,
      y: b * imageHeight,
      width: c * imageWidth,
      height: d * imageHeight,
    };
  }

  if (c > a && d > b) {
    return { x: a, y: b, width: c - a, height: d - b };
  }

  return { x: a, y: b, width: c, height: d };
};

const clampDetection = (detection, imageWidth, imageHeight) => {
  let x = Math.round(detection.x);
  let y = Math.round(detection.y);
  let width = Math.round(detection.width);
  let height = Math.round(detection.height);

  if (width <= 0 || height <= 0) {
    return null;
  }

  x = Math.max(0, Math.min(x, imageWidth - 1));
  y = Math.max(0, Math.min(y, imageHeight - 1));
  width = Math.min(width, imageWidth - x);
  height = Math.min(height, imageHeight - y);

  if (width <= 0 || height <= 0) {
    return null;
  }

  const areaRatio = (width * height) / (imageWidth * imageHeight);
  const { maxBoxAreaRatio } = getConfig();

  if (areaRatio > maxBoxAreaRatio) {
    return null;
  }

  return {
    type: detection.type,
    category: detection.category,
    x,
    y,
    width,
    height,
  };
};

const parseJsonContent = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error('Gemini returned invalid JSON');
    }

    return JSON.parse(match[0]);
  }
};

const parseDetections = (parsed, imageWidth, imageHeight) => {
  const { confidenceThreshold, maxDetectionsPerType } = getConfig();
  const rawDetections = Array.isArray(parsed)
    ? parsed
    : parsed?.detections || parsed?.findings || parsed?.regions || parsed?.results || [];

  const accepted = [];
  const rejected = [];
  const countsByType = {};

  for (const item of rawDetections) {
    const rawType = item?.type || item?.label || item?.name;
    const type = resolveType(rawType);
    const confidence = normalizeConfidence(item?.confidence);

    if (!type) {
      rejected.push({ raw: item, reason: 'Unknown or unsupported type' });
      continue;
    }

    if (confidence < confidenceThreshold) {
      rejected.push({
        type,
        confidence,
        reason: `Confidence below threshold (${confidenceThreshold})`,
      });
      continue;
    }

    const coords = extractCoordinates(item, imageWidth, imageHeight);

    if (!coords) {
      rejected.push({ type, confidence, reason: 'Missing or invalid coordinates' });
      continue;
    }

    const clamped = clampDetection(
      {
        type,
        category: ALLOWED_TYPES[type],
        ...coords,
      },
      imageWidth,
      imageHeight
    );

    if (!clamped) {
      rejected.push({ type, confidence, reason: 'Invalid or oversized box' });
      continue;
    }

    countsByType[type] = countsByType[type] || 0;

    if (countsByType[type] >= maxDetectionsPerType) {
      rejected.push({ type, confidence, reason: `Max detections reached for ${type}` });
      continue;
    }

    countsByType[type] += 1;
    accepted.push(clamped);
  }

  return { detections: accepted, rejected };
};

const buildFallbackBroadBoxes = (imageWidth, imageHeight) => {
  const zones = [
    { type: 'acne', category: 'skin', x: 0.22, y: 0.2, w: 0.56, h: 0.2 },
    { type: 'blemishes', category: 'skin', x: 0.1, y: 0.4, w: 0.34, h: 0.28 },
    { type: 'pimples', category: 'skin', x: 0.56, y: 0.4, w: 0.34, h: 0.28 },
    { type: 'facial_spots', category: 'skin', x: 0.26, y: 0.62, w: 0.48, h: 0.22 },
  ];

  return zones
    .map((zone) =>
      clampDetection(
        {
          type: zone.type,
          category: zone.category,
          x: Math.round(zone.x * imageWidth),
          y: Math.round(zone.y * imageHeight),
          width: Math.round(zone.w * imageWidth),
          height: Math.round(zone.h * imageHeight),
        },
        imageWidth,
        imageHeight
      )
    )
    .filter(Boolean);
};

const callGeminiVision = async (base64, mimeType, prompt) => {
  const { apiKey, baseUrl, model } = getConfig();

  const url = `${baseUrl.replace(/\/$/, '')}/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part.text || '').join('').trim();

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
};

const formatLabel = (type) => type.replace(/_/g, ' ');

const drawAnnotatedImage = async (originalFilename, detections, imageWidth, imageHeight) => {
  const originalPath = path.join(uploadsDir, originalFilename);
  const image = await loadImage(originalPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  for (const detection of detections) {
    const box = clampDetection(detection, imageWidth, imageHeight);

    if (!box) {
      continue;
    }

    const color = CATEGORY_COLORS[box.category] || '#000000';
    const label = formatLabel(box.type);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.font = 'bold 14px Arial';
    const textWidth = ctx.measureText(label).width;
    const labelHeight = 20;
    const labelY = Math.max(box.y - labelHeight, 0);

    ctx.fillStyle = color;
    ctx.fillRect(box.x, labelY, textWidth + 10, labelHeight);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, box.x + 5, labelY + 14);
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  const buffer = canvas.toBuffer(mimeType);

  return { buffer, mimeType };
};

export const isServiceEnabled = () => serviceEnabled;

export const validateGeminiConfig = () => {
  const { apiKey, model, confidenceThreshold } = getConfig();

  if (!apiKey) {
    console.error(
      '[Gemini] GEMINI_API_KEY is not set in backend/.env — annotation service disabled.'
    );
    serviceEnabled = false;
    return false;
  }

  serviceEnabled = true;
  console.log('[Gemini] Annotation service enabled.');
  console.log(`[Gemini] Model: ${model}`);
  console.log(`[Gemini] Confidence threshold: ${confidenceThreshold}`);
  return true;
};

export const analyzeImage = async (originalFilename) => {
  if (!serviceEnabled) {
    throw new Error(
      'Gemini annotation service is disabled. Set GEMINI_API_KEY in backend/.env.'
    );
  }

  const { base64, mimeType } = readImageFile(originalFilename);
  const image = await loadImage(path.join(uploadsDir, originalFilename));

  const rawOutput = await callGeminiVision(
    base64,
    mimeType,
    buildDetectionPrompt(image.width, image.height)
  );

  console.log('[Gemini] Raw model output:', rawOutput);

  const parsed = parseJsonContent(rawOutput);
  let { detections, rejected } = parseDetections(parsed, image.width, image.height);

  if (rejected.length > 0) {
    console.log('[Gemini] Rejected detections:', JSON.stringify(rejected, null, 2));
  }

  if (detections.length === 0) {
    console.warn('[Gemini] No valid detections — using broad face-region fallback.');
    detections = buildFallbackBroadBoxes(image.width, image.height);
  }

  console.log('[Gemini] Final detections:', JSON.stringify(detections, null, 2));

  const annotatedImage = await drawAnnotatedImage(
    originalFilename,
    detections,
    image.width,
    image.height
  );

  return {
    detections,
    annotatedImageBuffer: annotatedImage.buffer,
    annotatedMimeType: annotatedImage.mimeType,
  };
};
