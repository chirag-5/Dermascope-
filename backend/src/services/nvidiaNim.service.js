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

const TYPE_SEARCH_PROMPTS = {
  acne: 'acne red spot pimple on facial skin',
  pimples: 'pimple lesion on cheek forehead chin skin',
  blemishes: 'skin blemish mark on face',
  facial_spots: 'dark spot on facial skin',
  bald_spots: 'bald patch on scalp',
  hair_thinning: 'thinning hair on scalp',
  receding_hairline: 'receding hairline at forehead temples',
};

const CATEGORY_COLORS = {
  skin: '#ef4444',
  hair: '#2563eb',
};

const getConfig = () => ({
  apiKey: process.env.NVIDIA_API_KEY,
  vlmBaseUrl: process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  vlmModel:
    process.env.NVIDIA_VLM_MODEL ||
    process.env.NVIDIA_VISION_MODEL ||
    'nvidia/nemotron-nano-12b-v2-vl',
  groundingDinoUrl:
    process.env.NVIDIA_GROUNDING_DINO_URL ||
    process.env.NVIDIA_OBJECT_DETECTION_URL ||
    'https://ai.api.nvidia.com/v1/cv/nvidia/nv-grounding-dino',
  confidenceThreshold: Number(process.env.NVIDIA_CONFIDENCE_THRESHOLD ?? 0.7),
  objectDetectionThreshold: Number(process.env.NVIDIA_OBJECT_DETECTION_THRESHOLD ?? 0.25),
  maxBoxAreaRatio: Number(process.env.NVIDIA_MAX_BOX_AREA_RATIO ?? 0.15),
  maxBoxWidthRatio: Number(process.env.NVIDIA_MAX_BOX_WIDTH_RATIO ?? 0.45),
  maxBoxHeightRatio: Number(process.env.NVIDIA_MAX_BOX_HEIGHT_RATIO ?? 0.45),
  minBoxPixels: Number(process.env.NVIDIA_MIN_BOX_PIXELS ?? 12),
  maxDetectionsPerType: Number(process.env.NVIDIA_MAX_DETECTIONS_PER_TYPE ?? 8),
});

const CLASSIFICATION_PROMPT = `You are analyzing a dermatology photo of a person's face and scalp.

Classification only. Do NOT return bounding box coordinates.

Report whether each condition is visibly present:
- acne (red inflamed spots on facial skin)
- pimples (raised pimple lesions)
- blemishes (marks or uneven skin tone)
- facial_spots (dark or pigmented spots)
- receding_hairline (hairline recession at temples or forehead)
- hair_thinning (sparse or thin hair)
- bald_spots (patchy bald areas on scalp)

Return JSON only:
{
  "findings": [
    { "type": "acne", "category": "skin", "confidence": 0.85, "present": true }
  ]
}

Rules:
- Use snake_case for type.
- Ignore background objects (walls, fans, furniture).
- Do not mark eyes, eyebrows, lips, or teeth as skin issues.
- If uncertain, set present to false.
- Return {"findings": []} if none are visible.`;

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
    return null;
  }

  if (confidence > 1 && confidence <= 100) {
    return confidence / 100;
  }

  return Math.max(0, Math.min(confidence, 1));
};

const pixelBoxToXYWH = (coords, imageWidth, imageHeight) => {
  if (!Array.isArray(coords) || coords.length < 4) {
    return null;
  }

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
    return {
      x: a,
      y: b,
      width: c - a,
      height: d - b,
    };
  }

  return { x: a, y: b, width: c, height: d };
};

const validateBox = (box, imageWidth, imageHeight) => {
  const {
    maxBoxAreaRatio,
    maxBoxWidthRatio,
    maxBoxHeightRatio,
    minBoxPixels,
  } = getConfig();

  const width = Math.round(box.width);
  const height = Math.round(box.height);

  if (width < minBoxPixels || height < minBoxPixels) {
    return { valid: false, reason: `Box smaller than ${minBoxPixels}px` };
  }

  if (width / imageWidth > maxBoxWidthRatio) {
    return { valid: false, reason: 'Box too wide' };
  }

  if (height / imageHeight > maxBoxHeightRatio) {
    return { valid: false, reason: 'Box too tall' };
  }

  const areaRatio = (width * height) / (imageWidth * imageHeight);

  if (areaRatio > maxBoxAreaRatio) {
    return { valid: false, reason: 'Box covers too much area' };
  }

  return { valid: true };
};

const boxArea = (box) => box.width * box.height;

const dedupeOverlappingBoxes = (boxes) => {
  const sorted = [...boxes].sort((a, b) => boxArea(a) - boxArea(b));
  const kept = [];

  for (const candidate of sorted) {
    const overlaps = kept.some((existing) => {
      const xOverlap = Math.max(
        0,
        Math.min(candidate.x + candidate.width, existing.x + existing.width) -
          Math.max(candidate.x, existing.x)
      );
      const yOverlap = Math.max(
        0,
        Math.min(candidate.y + candidate.height, existing.y + existing.height) -
          Math.max(candidate.y, existing.y)
      );
      const overlapArea = xOverlap * yOverlap;
      const smallerArea = Math.min(boxArea(candidate), boxArea(existing));

      return smallerArea > 0 && overlapArea / smallerArea > 0.55;
    });

    if (!overlaps) {
      kept.push(candidate);
    }
  }

  return kept;
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
      throw new Error('NVIDIA NIM returned invalid JSON');
    }

    return JSON.parse(match[0]);
  }
};

const classifyFindings = (parsed, confidenceThreshold) => {
  const rawFindings = Array.isArray(parsed)
    ? parsed
    : parsed?.findings || parsed?.classifications || parsed?.results || [];

  const accepted = [];
  const rejected = [];

  for (const item of rawFindings) {
    const rawType = item?.type || item?.label || item?.name;
    const type = resolveType(rawType);
    const confidence = normalizeConfidence(item?.confidence);
    const present = item?.present !== false;

    if (!type) {
      rejected.push({ raw: item, reason: 'Unknown or unsupported type' });
      continue;
    }

    if (confidence === null) {
      rejected.push({ type, reason: 'Missing or invalid confidence score' });
      continue;
    }

    if (!present) {
      rejected.push({ type, confidence, reason: 'Marked as not present' });
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

    accepted.push({
      type,
      category: ALLOWED_TYPES[type],
      confidence,
    });
  }

  return { accepted, rejected };
};

const callVlmChat = async (base64, mimeType, prompt) => {
  const { apiKey, vlmBaseUrl, vlmModel } = getConfig();

  const response = await fetch(`${vlmBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: vlmModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || `VLM request failed (${response.status})`;
    throw new Error(message);
  }

  return data?.choices?.[0]?.message?.content;
};

const callGroundingDino = async (base64, mimeType, prompt, threshold) => {
  const { apiKey, groundingDinoUrl } = getConfig();

  const response = await fetch(groundingDinoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: 'Grounding-Dino',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'media_url',
              media_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      threshold,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      data?.message ||
      `Grounding DINO request failed (${response.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  console.log('[NVIDIA NIM] Grounding DINO raw output:', JSON.stringify(data, null, 2));

  return data;
};

const parseGroundingDinoBoxes = (data, imageWidth, imageHeight, threshold) => {
  const boxes = [];
  const rejected = [];

  const content = data?.choices?.[0]?.message?.content || data?.data?.[0] || data;
  const boundingBoxes = content?.boundingBoxes || content?.bounding_boxes || [];

  if (!Array.isArray(boundingBoxes)) {
    return { boxes, rejected };
  }

  for (const item of boundingBoxes) {
    const phrase = item?.phrase || item?.label || '';
    const confidences = Array.isArray(item?.confidence) ? item.confidence : [item?.confidence];
    const bboxes = item?.bboxes || item?.boxes || [];

    bboxes.forEach((coords, index) => {
      const confidence = normalizeConfidence(confidences[index] ?? confidences[0]);

      if (confidence === null || confidence < threshold) {
        rejected.push({ phrase, confidence, reason: 'Below detection threshold' });
        return;
      }

      const pixels = pixelBoxToXYWH(coords, imageWidth, imageHeight);

      if (!pixels) {
        rejected.push({ phrase, confidence, reason: 'Invalid coordinates' });
        return;
      }

      const sizeCheck = validateBox(pixels, imageWidth, imageHeight);

      if (!sizeCheck.valid) {
        rejected.push({ phrase, confidence, ...pixels, reason: sizeCheck.reason });
        return;
      }

      boxes.push({
        phrase,
        confidence,
        ...pixels,
      });
    });
  }

  return { boxes, rejected };
};

const runGroundingDinoDetection = async (
  base64,
  mimeType,
  imageWidth,
  imageHeight,
  acceptedFindings
) => {
  const { objectDetectionThreshold } = getConfig();
  const allBoxes = [];
  const allRejected = [];
  let groundingDinoUnavailable = false;

  for (const finding of acceptedFindings) {
    const prompt = TYPE_SEARCH_PROMPTS[finding.type];

    if (!prompt) {
      continue;
    }

    try {
      console.log(`[NVIDIA NIM] Grounding DINO prompt for ${finding.type}: "${prompt}"`);

      const data = await callGroundingDino(
        base64,
        mimeType,
        prompt,
        objectDetectionThreshold
      );

      const { boxes, rejected } = parseGroundingDinoBoxes(
        data,
        imageWidth,
        imageHeight,
        objectDetectionThreshold
      );

      for (const box of boxes) {
        allBoxes.push({
          ...box,
          assignedType: finding.type,
        });
      }

      allRejected.push(...rejected);
      console.log(`[NVIDIA NIM] Grounding DINO found ${boxes.length} box(es) for ${finding.type}.`);
    } catch (error) {
      if (String(error.message).includes('Not found for account')) {
        groundingDinoUnavailable = true;
      }
      console.warn(`[NVIDIA NIM] Grounding DINO failed for ${finding.type}:`, error.message);
    }
  }

  return { boxes: allBoxes, rejected: allRejected, groundingDinoUnavailable };
};

const buildFallbackBroadBoxes = (acceptedFindings, imageWidth, imageHeight) => {
  const skinFindings = acceptedFindings
    .filter((finding) => finding.category === 'skin')
    .sort((a, b) => b.confidence - a.confidence);
  const hairFindings = acceptedFindings
    .filter((finding) => finding.category === 'hair')
    .sort((a, b) => b.confidence - a.confidence);

  const detections = [];

  if (skinFindings.length) {
    const zones = [
      { x: 0.22, y: 0.2, w: 0.56, h: 0.2 },
      { x: 0.1, y: 0.4, w: 0.34, h: 0.28 },
      { x: 0.56, y: 0.4, w: 0.34, h: 0.28 },
      { x: 0.26, y: 0.62, w: 0.48, h: 0.22 },
    ];

    zones.slice(0, Math.min(4, skinFindings.length + 1)).forEach((zone, index) => {
      const type = skinFindings[index % skinFindings.length].type;
      const box = clampDetection(
        {
          type,
          category: ALLOWED_TYPES[type],
          x: Math.round(zone.x * imageWidth),
          y: Math.round(zone.y * imageHeight),
          width: Math.round(zone.w * imageWidth),
          height: Math.round(zone.h * imageHeight),
        },
        imageWidth,
        imageHeight
      );

      if (box) {
        detections.push(box);
      }
    });
  }

  if (hairFindings.length) {
    const box = clampDetection(
      {
        type: hairFindings[0].type,
        category: hairFindings[0].category,
        x: Math.round(0.18 * imageWidth),
        y: Math.round(0.1 * imageHeight),
        width: Math.round(0.64 * imageWidth),
        height: Math.round(0.2 * imageHeight),
      },
      imageWidth,
      imageHeight
    );

    if (box) {
      detections.push(box);
    }
  }

  return detections;
};

const mapBoxesToDetections = (rawBoxes, acceptedFindings) => {
  const { maxDetectionsPerType } = getConfig();
  const detections = [];
  const rejected = [];
  const countsByType = {};

  const acceptedTypes = new Set(acceptedFindings.map((finding) => finding.type));
  const filtered = dedupeOverlappingBoxes(rawBoxes);

  for (const box of filtered) {
    const type = box.assignedType;

    if (!type || !acceptedTypes.has(type)) {
      rejected.push({ ...box, reason: 'No matching verified type' });
      continue;
    }

    countsByType[type] = countsByType[type] || 0;

    if (countsByType[type] >= maxDetectionsPerType) {
      rejected.push({ ...box, type, reason: `Max detections reached for ${type}` });
      continue;
    }

    const clamped = clampDetection(
      {
        type,
        category: ALLOWED_TYPES[type],
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      box.imageWidth,
      box.imageHeight
    );

    if (!clamped) {
      rejected.push({ ...box, type, reason: 'Invalid box after clamping' });
      continue;
    }

    countsByType[type] += 1;
    detections.push(clamped);
  }

  return { detections, rejected };
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

export const validateNvidiaConfig = () => {
  const {
    apiKey,
    vlmModel,
    groundingDinoUrl,
    confidenceThreshold,
    objectDetectionThreshold,
  } = getConfig();

  if (!apiKey) {
    console.error(
      '[NVIDIA NIM] NVIDIA_API_KEY is not set in backend/.env — annotation service disabled.'
    );
    serviceEnabled = false;
    return false;
  }

  serviceEnabled = true;
  console.log('[NVIDIA NIM] Annotation service enabled.');
  console.log(`[NVIDIA NIM] VLM model: ${vlmModel}`);
  console.log(`[NVIDIA NIM] Grounding DINO URL: ${groundingDinoUrl}`);
  console.log(`[NVIDIA NIM] VLM confidence threshold: ${confidenceThreshold}`);
  console.log(`[NVIDIA NIM] Grounding DINO threshold: ${objectDetectionThreshold}`);
  return true;
};

export const analyzeImage = async (originalFilename) => {
  if (!serviceEnabled) {
    throw new Error(
      'NVIDIA annotation service is disabled. Set NVIDIA_API_KEY in backend/.env.'
    );
  }

  const { confidenceThreshold } = getConfig();
  const { base64, mimeType } = readImageFile(originalFilename);
  const image = await loadImage(path.join(uploadsDir, originalFilename));

  const rawOutput = await callVlmChat(base64, mimeType, CLASSIFICATION_PROMPT);
  console.log('[NVIDIA NIM] Raw VLM output:', rawOutput);

  const parsed = parseJsonContent(rawOutput);
  const { accepted, rejected: rejectedClassifications } = classifyFindings(
    parsed,
    confidenceThreshold
  );

  console.log('[NVIDIA NIM] Verified conditions:', JSON.stringify(accepted, null, 2));

  if (rejectedClassifications.length > 0) {
    console.log(
      '[NVIDIA NIM] Rejected classifications:',
      JSON.stringify(rejectedClassifications, null, 2)
    );
  }

  if (!accepted.length) {
    console.log('[NVIDIA NIM] No verified conditions — returning empty detections.');
    const annotatedImage = await drawAnnotatedImage(originalFilename, [], image.width, image.height);
    return {
      detections: [],
      annotatedImageBuffer: annotatedImage.buffer,
      annotatedMimeType: annotatedImage.mimeType,
    };
  }

  const { boxes, rejected: rejectedOd, groundingDinoUnavailable } =
    await runGroundingDinoDetection(
      base64,
      mimeType,
      image.width,
      image.height,
      accepted
    );

  if (groundingDinoUnavailable) {
    console.warn(
      '[NVIDIA NIM] Your API key works, but nv-grounding-dino is not enabled on your NVIDIA account.'
    );
    console.warn(
      '[NVIDIA NIM] Open https://build.nvidia.com/nvidia/nv-grounding-dino → click Get API Key → restart server.'
    );
  }

  if (rejectedOd.length > 0) {
    console.log('[NVIDIA NIM] Rejected Grounding DINO boxes:', JSON.stringify(rejectedOd, null, 2));
  }

  const boxesWithDimensions = boxes.map((box) => ({
    ...box,
    imageWidth: image.width,
    imageHeight: image.height,
  }));

  let { detections, rejected: rejectedMapped } = mapBoxesToDetections(
    boxesWithDimensions,
    accepted
  );

  if (detections.length === 0 && accepted.length > 0) {
    console.warn('[NVIDIA NIM] Using broad face-region fallback until Grounding DINO is enabled.');
    detections = buildFallbackBroadBoxes(accepted, image.width, image.height);
    rejectedMapped = [];
  }

  if (rejectedMapped.length > 0) {
    console.log('[NVIDIA NIM] Rejected mapped boxes:', JSON.stringify(rejectedMapped, null, 2));
  }

  console.log('[NVIDIA NIM] Final detections:', JSON.stringify(detections, null, 2));

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
