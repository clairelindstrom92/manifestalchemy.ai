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
