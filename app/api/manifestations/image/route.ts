import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/ai/imageRouter";
import { chatComplete } from "@/lib/ai/router";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "manifestation-media";

const getSupabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  try { return createClient(supabaseUrl, supabaseServiceKey); } catch { return null; }
};

// ---------------------------------------------------------------
// Build a vivid, MANIFESTA-aesthetic image prompt from the
// user's manifestation context using the AI
// ---------------------------------------------------------------
async function buildImagePrompt(manifestationContext: string): Promise<string> {
  try {
    const scene = await chatComplete(
      [
        {
          role: "system",
          content:
            "You write vivid image prompts for manifestation vision boards. Given a goal, describe ONE specific, cinematic scene showing the person ALREADY LIVING this reality. Be specific: describe the setting, lighting, mood, clothing, and details. Examples of your output style:\n- 'A confident woman signing a luxury real estate contract in a sleek modern office, afternoon golden light streaming through floor-to-ceiling windows, champagne on the table'\n- 'A person sitting in the driver seat of a midnight blue Tesla Model Y, ocean road, hair blowing, pure joy on their face, golden hour'\n- 'A couple holding hands at their dream wedding in a vineyard, soft fairy lights, white floral arch, magical summer evening'\nKeep it under 80 words. Return ONLY the scene description, nothing else.",
        },
        {
          role: "user",
          content: `Manifestation goal: ${manifestationContext}`,
        },
      ],
      { temperature: 0.8 }
    );

    const cleaned = scene.trim().replace(/^["']|["']$/g, "");
    // Append the MANIFESTA aesthetic keywords from the FLUX training captions
    return `${cleaned}, manifestation aesthetic, luxury lifestyle, golden light, cinematic, high vibrational energy, Pinterest style, aspirational, divine feminine, opulent, 8k, editorial photography`;
  } catch {
    // Fallback if AI prompt builder fails
    return `${manifestationContext}, manifestation aesthetic, luxury lifestyle, golden light, cinematic, high vibrational energy, aspirational, divine feminine, opulent`;
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Server not configured for image generation" },
      { status: 500 }
    );
  }

  try {
    const { manifestationId, prompt, userId } = await request.json();

    if (!manifestationId) {
      return NextResponse.json({ error: "manifestationId is required" }, { status: 400 });
    }

    const baseContext =
      prompt?.trim() || "a person living their dream life, abundant and fulfilled";

    // Generate a vivid, specific scene prompt using the AI + MANIFESTA vocabulary
    const finalPrompt = await buildImagePrompt(baseContext);

    // Fetch reference image for FLUX IP-Adapter conditioning
    let referenceImageUrl: string | undefined;
    if (userId) {
      const { data: refImages } = await supabase
        .from("reference_images")
        .select("source_url")
        .eq("user_id", userId)
        .eq("manifestation_id", manifestationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (refImages && refImages.length > 0) {
        referenceImageUrl = refImages[0].source_url;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .maybeSingle();
        referenceImageUrl = profile?.avatar_url ?? undefined;
      }
    }

    const generated = await generateImage(finalPrompt, { referenceImageUrl });

    let publicUrl: string;

    if (generated.b64) {
      const buffer = Buffer.from(generated.b64, "base64");
      const filePath = `${manifestationId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
    } else if (generated.url) {
      const imgResponse = await fetch(generated.url);
      if (!imgResponse.ok) throw new Error("Failed to download generated image");
      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      const filePath = `${manifestationId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
    } else {
      throw new Error("No image data returned from provider");
    }

    // Append to manifestation gallery
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
      .update({ intent: { ...(existing?.intent || {}), gallery }, updated_at: new Date().toISOString() })
      .eq("id", manifestationId);

    return NextResponse.json({ imageUrl: publicUrl, promptUsed: finalPrompt });
  } catch (error) {
    console.error("Image generation failed:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
