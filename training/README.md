# Manifest Alchemy AI — Model Training Guide

This directory contains everything needed to train your own fine-tuned models.

---

## Part 1: Fine-Tune the Language Model (Local — RTX 3060)

### Prerequisites

Install dependencies (run once in a Python 3.10+ environment):

```bash
# Step 1: Install PyTorch with CUDA 12.4 (RTX 3060, driver 581.29)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Step 2: Install Unsloth + training stack
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install trl transformers datasets accelerate "bitsandbytes>=0.43.0"
```

> Verify CUDA works: `python -c "import torch; print(torch.cuda.is_available())"` — should print `True`.

### Step 1: Build Your Dataset

The file `dataset.jsonl` is what you train on. Each line is one conversation example.

**Format:**
```json
{"messages": [
  {"role": "system", "content": "You are Manifest Alchemy AI..."},
  {"role": "user", "content": "User message here"},
  {"role": "assistant", "content": "Your ideal AI response here"}
]}
```

**How to get training data:**

1. **Start with the sample** — Copy `dataset_sample.jsonl` to `dataset.jsonl` to begin
2. **Export real chats** — Run this SQL in Supabase to export real conversations:
   ```sql
   SELECT content FROM posts WHERE content IS NOT NULL LIMIT 500;
   ```
   Then parse each `content` JSON array into the training format
3. **Generate synthetic examples** — Use GPT-4 to generate 500+ examples in this prompt style:
   ```
   Generate 50 examples of a mystical-yet-methodical manifestation coach asking one
   precise question at a time. Each example: one user goal, one coach response.
   Output as JSONL in the format shown above.
   ```
4. **Write gold examples** — Write 50-100 of your ideal responses manually. These are the most valuable.

**Target: 500-2000 examples for best results.**

### Step 2: Train

```bash
cd training
python train_llm.py
```

Training takes ~2-4 hours on RTX 3060. Watch the loss go down — target below 1.0.

### Step 3: Convert to GGUF for Ollama

```bash
# Install llama.cpp (one-time)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && pip install -r requirements.txt

# Convert (from inside llama.cpp directory)
python convert_hf_to_gguf.py ../training/outputs/manifest-coach-lora/final \
  --outfile ../training/manifest-coach.gguf \
  --outtype q4_k_m
```

### Step 4: Load into Ollama

```bash
# Install Ollama from https://ollama.com
# Then:
ollama create manifest-coach -f training/Modelfile
```

### Step 5: Test

```bash
ollama run manifest-coach
# Type: "I want to manifest a Tesla"
# It should ask ONE precise question back
```

### Step 6: Activate in the App

In `.env.local`:
```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=manifest-coach
```

Restart the dev server — your fine-tuned model is now powering the chat.

### Step 7: Deploy to Production (Replicate)

```bash
# Push your HuggingFace model to Replicate
# Option 1: Use Replicate's web UI (easiest)
# Go to replicate.com > Create a new model > select Llama3 template
# Upload your ./outputs/manifest-coach-lora/final weights

# Option 2: Use Cog CLI
pip install cog
# Follow: https://replicate.com/docs/guides/fine-tune-a-language-model
```

Then in `.env.local`:
```bash
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_your_token_here
REPLICATE_LLM_MODEL_VERSION=your_model_version_hash
```

---

## Part 2: Train the Image Model (Cloud — RunPod, ~$15)

Your RTX 3060 6GB is too small for FLUX.1 training. Use RunPod for one training run.

### Step 1: Prepare Your Image Dataset (Already Done!)

Your dataset is ready at `training/flux_dataset/`:
```
flux_dataset/
  images/    ← 619 Midjourney PNGs (img_0001.png … img_0619.png)
  captions/  ← 619 matching .txt files (one per image)
```

**Trigger word: `MANIFESTA`**
Every caption starts with `MANIFESTA` — this is the magic keyword the model learns to associate with your aesthetic. At inference time, any prompt you send that starts with `MANIFESTA` will automatically activate your trained style.

**Caption format (already applied):**
```
MANIFESTA, <midjourney prompt>, manifestation aesthetic, luxury lifestyle, golden light, cinematic, high vibrational energy, Pinterest style, aspirational, divine feminine, opulent
```

### Step 2: Set Up RunPod

1. Go to **runpod.io** and create an account
2. Click **"Pods"** > **"+ Deploy"**
3. GPU: **A100 SXM 80GB** (~$2.49/hr) — or **A40** for cheaper (~$0.79/hr, slower)
4. Template: **"RunPod PyTorch 2.2"** (pre-installed CUDA, diffusers)
5. Container disk: **50 GB**
6. Click **"Deploy"** — pod starts in ~60 seconds

### Step 3: Upload Your Dataset

**Option A — RunPod's built-in file browser (easiest):**
1. In your pod, click the folder icon in the sidebar
2. Navigate to `/workspace/`
3. Upload the entire `flux_dataset/` folder (drag & drop)

**Option B — zip and upload:**
```bash
# On your local machine (PowerShell):
Compress-Archive -Path "C:\Users\clair\OneDrive\Desktop\manifestalchemyai\training\flux_dataset" -DestinationPath "C:\Users\clair\Desktop\flux_dataset.zip"
# Then upload flux_dataset.zip in RunPod file browser and unzip it there
```

In RunPod terminal to unzip:
```bash
cd /workspace && unzip flux_dataset.zip
```

### Step 4: Train FLUX.1 LoRA (kohya sd-scripts)

Copy-paste this entire block into the RunPod terminal:

```bash
# 1. Install kohya sd-scripts
cd /workspace
git clone https://github.com/kohya-ss/sd-scripts.git
cd sd-scripts
pip install -r requirements.txt

# 2. Log into HuggingFace (needed to download FLUX.1-dev)
#    Get your token from: huggingface.co/settings/tokens
huggingface-cli login

# 3. Prepare dataset folder structure kohya expects
mkdir -p /workspace/train_data/1_MANIFESTA
cp /workspace/flux_dataset/images/*.png /workspace/train_data/1_MANIFESTA/
cp /workspace/flux_dataset/captions/*.txt /workspace/train_data/1_MANIFESTA/
# Rename captions to match image names (kohya uses .txt with same stem as image)

# 4. Run training
python train_network.py \
  --pretrained_model_name_or_path="black-forest-labs/FLUX.1-dev" \
  --dataset_config="/workspace/flux_dataset_config.toml" \
  --output_dir="/workspace/outputs" \
  --output_name="manifest-alchemy-flux-lora" \
  --network_module="networks.lora_flux" \
  --network_dim=16 \
  --network_alpha=8 \
  --optimizer_type="adamw8bit" \
  --lr_scheduler="cosine" \
  --learning_rate="4e-4" \
  --max_train_steps=3000 \
  --save_every_n_steps=500 \
  --mixed_precision="bf16" \
  --cache_latents \
  --cache_text_encoder_outputs
```

The file `flux_dataset_config.toml` (included in this training folder) is uploaded automatically with your dataset.

Training takes ~1-2 hours on A100. Total cost: ~$3-5.

### Step 5: Download and Deploy

```bash
# Download the .safetensors file from RunPod to your local machine
scp user@pod-ip:/workspace/sd-scripts/outputs/manifest-alchemy-flux-lora.safetensors .
```

Deploy on Replicate:
1. Go to replicate.com > Create model
2. Use `black-forest-labs/flux-dev-lora` as the base
3. Upload `manifest-alchemy-flux-lora.safetensors`
4. Note the model version hash

In `.env.local`:
```bash
IMAGE_PROVIDER=replicate
REPLICATE_IMAGE_MODEL_VERSION=your_flux_lora_version_hash
```

---

## Environment Variable Reference

```bash
# .env.local — complete reference

# ── Existing (keep these) ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...          # Always needed for embeddings

# ── Provider switches ──────────────────────────────────────
AI_PROVIDER=openai             # openai | ollama | replicate
IMAGE_PROVIDER=openai          # openai | replicate

# ── Ollama (local dev, after LLM training) ─────────────────
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=manifest-coach

# ── Replicate (production) ─────────────────────────────────
REPLICATE_API_TOKEN=r8_...
REPLICATE_LLM_MODEL_VERSION=   # From replicate.com after LLM deploy
REPLICATE_IMAGE_MODEL_VERSION= # From replicate.com after FLUX deploy
```

---

## Switching Providers (Zero Downtime)

The app is designed so you can switch AI providers by changing one env var — no code changes.

| Scenario | AI_PROVIDER | IMAGE_PROVIDER |
|---|---|---|
| Development (OpenAI) | `openai` | `openai` |
| Testing fine-tuned LLM locally | `ollama` | `openai` |
| Production (both custom models) | `replicate` | `replicate` |
| Quick rollback | `openai` | `openai` |

On Vercel: Dashboard > Your Project > Settings > Environment Variables.
Change the value and redeploy (or use Vercel's "Override" for instant effect).
