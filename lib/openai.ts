import { HfInference } from '@huggingface/inference';

export function getHFClient() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('Environment check:', {
    HUGGINGFACE_API_KEY: apiKey ? 'Found' : 'Not found'
  });
  
  if (!apiKey) {
    throw new Error('HuggingFace API key is not configured');
  }
  
  return new HfInference(apiKey);
}
