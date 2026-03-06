/**
 * lib/ai/imageRouter.ts
 * Image generation provider abstraction
 *
 * IMAGE_PROVIDER=openai     → OpenAI gpt-image-1 (default)
 * IMAGE_PROVIDER=replicate  → Your FLUX.1 LoRA deployed on Replicate
 */

import OpenAI from 'openai';

export type ImageProvider = 'openai' | 'replicate';

export interface GeneratedImage {
  /** Base64-encoded PNG, or null if URL-based provider */
  b64: string | null;
  /** Public URL, or null if base64-based provider */
  url: string | null;
}

const provider = (process.env.IMAGE_PROVIDER ?? 'openai') as ImageProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? '';
const REPLICATE_IMAGE_VERSION = process.env.REPLICATE_IMAGE_MODEL_VERSION ?? '';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  return _openai;
}

export interface ImageOptions {
  /** URL of a reference image (profile photo or inspiration image).
   *  Passed to FLUX as IP-Adapter conditioning — influences face/style.
   *  Ignored by OpenAI provider (unsupported). */
  referenceImageUrl?: string;
  /** 0.0–1.0 — how strongly FLUX follows the reference image.
   *  0.2–0.4 gives good face similarity without overriding the prompt. */
  referenceStrength?: number;
}

// ---------------------------------------------------------------
// generateImage — call this from /api/manifestations/image
// ---------------------------------------------------------------
export async function generateImage(
  prompt: string,
  options: ImageOptions = {}
): Promise<GeneratedImage> {
  switch (provider) {
    case 'replicate':
      return generateReplicate(prompt, options);
    case 'openai':
    default:
      return generateOpenAI(prompt);
  }
}

// ---------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------

async function generateOpenAI(prompt: string): Promise<GeneratedImage> {
  const openai = getOpenAI();
  // gpt-image-1 always returns b64_json — do not pass response_format
  const result = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
  } as Parameters<typeof openai.images.generate>[0]);

  const b64 = ((result as any).data?.[0])?.b64_json ?? null;
  return { b64, url: null };
}

// Trigger word for the MANIFESTA FLUX.1 LoRA — injected into every Replicate prompt
// so the model reliably activates the trained aesthetic.
const FLUX_TRIGGER = 'MANIFESTA';

async function generateReplicate(prompt: string, options: ImageOptions = {}): Promise<GeneratedImage> {
  if (!REPLICATE_API_TOKEN || !REPLICATE_IMAGE_VERSION) {
    console.warn('Replicate image not configured, falling back to OpenAI');
    return generateOpenAI(prompt);
  }

  // Inject trigger word so LoRA activates the branded aesthetic
  const replicatePrompt = `${FLUX_TRIGGER}, ${prompt}`;

  // Build FLUX input — add IP-Adapter reference if provided
  const input: Record<string, unknown> = {
    prompt: replicatePrompt,
    width: 1024,
    height: 1024,
    num_outputs: 1,
    num_inference_steps: 28,
    guidance_scale: 3.5,
  };

  if (options.referenceImageUrl) {
    // FLUX IP-Adapter: passes user's photo as identity/style reference
    input.image_prompt = options.referenceImageUrl;
    input.image_prompt_strength = options.referenceStrength ?? 0.3;
  }

  // FLUX.1-dev LoRA prediction
  const response = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_IMAGE_VERSION}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait', // Wait for completion (up to 60s)
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate image error ${response.status}: ${err}`);
  }

  const data = await response.json();

  // Replicate FLUX returns output as array of URLs
  const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!outputUrl) throw new Error('No image URL returned from Replicate');

  return { b64: null, url: outputUrl };
}
