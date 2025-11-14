import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BUCKET = "manifestation-media";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function POST(request: NextRequest) {
  if (!supabase || !openai) {
    return NextResponse.json(
      { error: "Server not configured for image generation" },
      { status: 500 }
    );
  }

  try {
    const { manifestationId, prompt } = await request.json();

    if (!manifestationId) {
      return NextResponse.json(
        { error: "manifestationId is required" },
        { status: 400 }
      );
    }

    const finalPrompt =
      prompt?.trim() ||
      "Luminescent, cinematic manifestation scene infused with golden light and hopeful energy";

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const imageData = result.data?.[0]?.b64_json;
    if (!imageData) {
      throw new Error("No image data returned");
    }

    const buffer = Buffer.from(imageData, "base64");
    const filePath = `${manifestationId}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    const { data: existing } = await supabase
      .from("manifestations")
      .select("intent")
      .eq("id", manifestationId)
      .maybeSingle();

    const gallery = Array.isArray(existing?.intent?.gallery)
      ? [...existing!.intent.gallery, publicUrl]
      : [publicUrl];

    await supabase
      .from("manifestations")
      .update({
        intent: {
          ...(existing?.intent || {}),
          gallery,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", manifestationId);

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Manifestation image generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

