"""
train_llm.py — Fine-tune Llama 3.1 8B on manifestation coaching data
using QLoRA + Unsloth on your RTX 3060 (6GB VRAM)

SETUP (run once):
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
    pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
    pip install trl transformers datasets accelerate "bitsandbytes>=0.43.0"

USAGE:
    python train_llm.py

EXPECTED TIME: ~2-4 hours for 2 epochs on ~1000 examples
VRAM USAGE:    ~5.5GB (fits in RTX 3060 6GB)
OUTPUT:        ./outputs/manifest-coach-lora/final/
"""

from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset
import torch

# ─── Config ───────────────────────────────────────────────────────────────────
MODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"  # Pre-quantized for low VRAM
OUTPUT_DIR = "./outputs/manifest-coach-lora"
DATASET_PATH = "./dataset.jsonl"
MAX_SEQ_LENGTH = 2048
LORA_RANK = 16          # Higher = more capacity, more VRAM. 16 is good for 6GB.
BATCH_SIZE = 2          # Per device
GRAD_ACCUM = 4          # Effective batch = BATCH_SIZE * GRAD_ACCUM = 8
LEARNING_RATE = 2e-4
EPOCHS = 2
# ──────────────────────────────────────────────────────────────────────────────

print("Loading base model...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=torch.float16,
    load_in_4bit=True,      # 4-bit quantization = ~4x less VRAM
)

print("Applying LoRA adapters...")
model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_RANK,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=LORA_RANK,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",   # Saves ~30% VRAM
    random_state=42,
)

print(f"Loading dataset from {DATASET_PATH}...")
dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def format_messages(example):
    """Convert each example to ChatML format for Llama 3.1 Instruct."""
    messages = example["messages"]
    return {
        "text": tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False
        )
    }

dataset = dataset.map(format_messages, remove_columns=dataset.column_names)
print(f"Dataset size: {len(dataset)} examples")

print("Starting training...")
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        warmup_steps=20,
        num_train_epochs=EPOCHS,
        learning_rate=LEARNING_RATE,
        fp16=True,
        logging_steps=10,
        output_dir=OUTPUT_DIR,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        save_steps=200,
        save_total_limit=2,
    ),
)

trainer_stats = trainer.train()
print(f"\nTraining complete!")
print(f"  Total steps: {trainer_stats.global_step}")
print(f"  Training loss: {trainer_stats.training_loss:.4f}")

# Save LoRA weights
final_dir = f"{OUTPUT_DIR}/final"
print(f"\nSaving model to {final_dir}...")
model.save_pretrained(final_dir)
tokenizer.save_pretrained(final_dir)
print("Done! Next steps:")
print("  1. Convert to GGUF: see README.md")
print("  2. Load into Ollama: ollama create manifest-coach -f Modelfile")
print("  3. Test: ollama run manifest-coach")

# Optional: push to HuggingFace Hub
# from huggingface_hub import login
# login(token="your-hf-token")
# model.push_to_hub("your-username/manifest-coach-llama3.1-8b-lora")
# tokenizer.push_to_hub("your-username/manifest-coach-llama3.1-8b-lora")
