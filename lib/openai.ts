import { HfInference } from '@huggingface/inference';

export function getHFClient() {
  const apiKey = (process.env.HUGGINGFACE_API_KEY || '') as string;
  return new HfInference(apiKey);
}

// Direct API call function as a fallback
export async function callHFAPI(
  model: string,
  inputs: string,
  parameters: any
): Promise<any> {
  const apiKey = (process.env.HUGGINGFACE_API_KEY || '') as string;
  
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs,
        ...parameters,
      }),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} ${response.statusText} - ${errorData}`);
  }
  
  return response.json();
}
