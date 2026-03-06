/**
 * lib/ai/router.ts
 * AI provider abstraction — swap between openai, ollama, replicate
 * via the AI_PROVIDER environment variable.
 *
 * AI_PROVIDER=openai    → OpenAI gpt-4o-mini (default)
 * AI_PROVIDER=ollama    → Local fine-tuned Llama 3.1 via Ollama
 * AI_PROVIDER=replicate → Fine-tuned model deployed on Replicate
 */

import OpenAI from 'openai';

export type AIProvider = 'openai' | 'ollama' | 'replicate';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const provider = (process.env.AI_PROVIDER ?? 'openai') as AIProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'manifest-coach';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? '';
const REPLICATE_LLM_VERSION = process.env.REPLICATE_LLM_MODEL_VERSION ?? '';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------
// chatComplete — full response (used for JSON extraction)
// ---------------------------------------------------------------
export async function chatComplete(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const temp = options?.temperature ?? 0.5;

  switch (provider) {
    case 'ollama':
      return chatOllama(messages, temp);
    case 'replicate':
      return chatReplicate(messages, temp);
    case 'openai':
    default:
      return chatOpenAI(messages, temp);
  }
}

// ---------------------------------------------------------------
// chatStream — streaming response, yields text chunks
// Falls back to single yield for non-streaming providers
// ---------------------------------------------------------------
export async function* chatStream(
  messages: ChatMessage[],
  options?: { temperature?: number }
): AsyncGenerator<string> {
  const temp = options?.temperature ?? 0.5;

  if (provider === 'openai') {
    yield* chatStreamOpenAI(messages, temp);
  } else {
    // Ollama and Replicate: yield full response as one chunk
    const text = await chatComplete(messages, { temperature: temp });
    yield text;
  }
}

// ---------------------------------------------------------------
// embedText — always uses OpenAI
// ---------------------------------------------------------------
export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding as unknown as number[];
}

// ---------------------------------------------------------------
// jsonComplete — structured intent extraction (always OpenAI)
// ---------------------------------------------------------------
export async function jsonComplete(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    temperature: options?.temperature ?? 0,
    response_format: { type: 'json_object' },
    messages,
  });
  return completion.choices[0]?.message?.content ?? '{}';
}

// ---------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------

async function chatOpenAI(messages: ChatMessage[], temperature: number): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    temperature,
    messages,
  });
  return completion.choices[0]?.message?.content ?? '';
}

async function* chatStreamOpenAI(
  messages: ChatMessage[],
  temperature: number
): AsyncGenerator<string> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    temperature,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

async function chatOllama(messages: ChatMessage[], temperature: number): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

async function chatReplicate(messages: ChatMessage[], temperature: number): Promise<string> {
  if (!REPLICATE_API_TOKEN || !REPLICATE_LLM_VERSION) {
    console.warn('Replicate not configured, falling back to OpenAI');
    return chatOpenAI(messages, temperature);
  }

  const prompt = messages
    .map((m) => {
      if (m.role === 'system') return `<|system|>\n${m.content}`;
      if (m.role === 'user') return `<|user|>\n${m.content}`;
      return `<|assistant|>\n${m.content}`;
    })
    .join('\n') + '\n<|assistant|>\n';

  const response = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_LLM_VERSION}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: { prompt, temperature, max_new_tokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate error ${response.status}: ${err}`);
  }

  const data = await response.json();
  if (Array.isArray(data.output)) return data.output.join('');
  return data.output ?? '';
}
