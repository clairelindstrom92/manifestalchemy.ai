"""
prepare_images.py
Copies Midjourney PNGs into the FLUX training folder and
auto-generates captions from the filenames.

Usage:
    python prepare_images.py

No extra packages needed.
"""

import os
import re
import shutil

# ── Config ────────────────────────────────────────────────────────────────────
SOURCE_DIR  = r"C:\Users\clair\OneDrive\Desktop\midjourneypics"
OUTPUT_DIR  = r"C:\Users\clair\OneDrive\Desktop\manifestalchemyai\training\flux_dataset"
IMAGE_DIR   = os.path.join(OUTPUT_DIR, "images")
CAPTION_DIR = os.path.join(OUTPUT_DIR, "captions")

# Trigger word that activates the LoRA's branded aesthetic at inference time.
# MUST appear at the start of every caption so the model learns to associate it.
TRIGGER_WORD = "MANIFESTA"

# Aesthetic tags appended to every caption to reinforce the brand style
STYLE_SUFFIX = (
    "manifestation aesthetic, luxury lifestyle, golden light, "
    "cinematic, high vibrational energy, Pinterest style, "
    "aspirational, divine feminine, opulent"
)
# ─────────────────────────────────────────────────────────────────────────────

UUID_PATTERN = re.compile(
    r'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+$',
    re.IGNORECASE
)
USER_PREFIX = re.compile(r'^(social_)?u\d+_', re.IGNORECASE)


def extract_caption(filename: str) -> str:
    """Pull the prompt out of a Midjourney filename."""
    stem = os.path.splitext(filename)[0]          # remove .png
    stem = USER_PREFIX.sub('', stem)               # remove u1234567_
    stem = UUID_PATTERN.sub('', stem)              # remove _uuid_index
    stem = stem.replace('_', ' ').strip()          # underscores → spaces
    stem = re.sub(r'\s+', ' ', stem)               # collapse whitespace
    # Remove Midjourney flags like --ar 16:9
    stem = re.sub(r'--\w[\w:]*\s*[\d:]*', '', stem).strip()
    return stem


def main():
    os.makedirs(IMAGE_DIR,   exist_ok=True)
    os.makedirs(CAPTION_DIR, exist_ok=True)

    png_files = [f for f in os.listdir(SOURCE_DIR)
                 if f.lower().endswith('.png')]

    if not png_files:
        print(f"No PNG files found in {SOURCE_DIR}")
        return

    print(f"Found {len(png_files)} PNG files. Processing...")
    skipped = 0

    for i, filename in enumerate(png_files, 1):
        src  = os.path.join(SOURCE_DIR, filename)
        # Rename to clean sequential names for training
        new_name   = f"img_{i:04d}.png"
        dst_img    = os.path.join(IMAGE_DIR,   new_name)
        dst_caption = os.path.join(CAPTION_DIR, f"img_{i:04d}.txt")

        # Skip if already processed
        if os.path.exists(dst_img):
            skipped += 1
            continue

        caption = extract_caption(filename)
        if not caption:
            caption = "luxury manifestation scene"

        full_caption = f"{TRIGGER_WORD}, {caption}, {STYLE_SUFFIX}"

        shutil.copy2(src, dst_img)
        with open(dst_caption, 'w', encoding='utf-8') as f:
            f.write(full_caption)

        print(f"  [{i}/{len(png_files)}] {new_name}")
        print(f"    Caption: {full_caption[:80]}...")

    processed = len(png_files) - skipped
    print(f"\nDone!")
    print(f"  Processed : {processed} images")
    print(f"  Skipped   : {skipped} (already existed)")
    print(f"  Images    → {IMAGE_DIR}")
    print(f"  Captions  → {CAPTION_DIR}")
    print(f"\nNext step: upload flux_dataset/ to RunPod and run the FLUX training.")


if __name__ == "__main__":
    main()
