import { HfInference } from '@huggingface/inference';

export function getHFClient() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('Environment check:', {
    HUGGINGFACE_API_KEY: apiKey ? `${apiKey.substring(0, 5)}...` : 'Not found',
    nodeEnv: process.env.NODE_ENV
  });
  
  if (!apiKey) {
    const error = 'HuggingFace API key is not configured. Please add HUGGINGFACE_API_KEY to your environment variables.';
    console.error(error);
    throw new Error(error);
  }
  
  try {
    return new HfInference(apiKey);
  } catch (error) {
    console.error('Failed to create HfInference client:', error);
    throw error;
  }
}

// Direct API call function as a fallback
export async function callHFAPI(
  model: string,
  inputs: string,
  parameters: any
): Promise<any> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('HuggingFace API key is not configured');
  }
  
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
        parameters,
      }),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} ${response.statusText} - ${errorData}`);
  }
  
  return response.json();
}
