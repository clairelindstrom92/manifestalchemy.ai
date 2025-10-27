import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasApiKey: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not configured',
    timestamp: new Date().toISOString()
  });
}
