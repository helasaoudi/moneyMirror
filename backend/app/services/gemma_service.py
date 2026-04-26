from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
from app.utils.config import config
import logging

# Configure logging
logger = logging.getLogger(__name__)

class GemmaService:
    def __init__(self):
        self.model_name = config.GEMMA_MODEL_PATH
        self.tokenizer = None
        self.model = None
        self.model_loaded = False
        self.load_error = None
    
    def _load_model(self):
        """
        Load Gemma model from HuggingFace (lazy-loading)
        Raises exception if model cannot be loaded
        """
        if self.model_loaded:
            logger.info("✅ Gemma model already loaded")
            return True
        
        if self.load_error:
            logger.error(f"❌ Previous load error: {self.load_error}")
            raise Exception(f"Gemma model failed to load previously: {self.load_error}")
            
        try:
            logger.info(f"📥 Loading Gemma model: {self.model_name}...")
            logger.info("This may take a moment on first load...")
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            logger.info("✅ Tokenizer loaded")
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                low_cpu_mem_usage=True
            )
            logger.info("✅ Model loaded successfully!")
            logger.info(f"🎯 Using device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
            
            self.model_loaded = True
            return True
            
        except Exception as e:
            error_msg = str(e)
            self.load_error = error_msg
            logger.error(f"❌ Failed to load Gemma model: {error_msg}")
            
            if "gated repo" in error_msg.lower() or "authenticated" in error_msg.lower():
                logger.error("\n⚠️  AUTHENTICATION REQUIRED:")
                logger.error("1. Visit: https://huggingface.co/google/gemma-2-2b-it")
                logger.error("2. Accept terms and get access")
                logger.error("3. Get token from: https://huggingface.co/settings/tokens")
                logger.error("4. Run: huggingface-cli login\n")
            
            raise Exception(f"Failed to load Gemma model: {error_msg}")
    
    def analyze_receipt(self, receipt_text: str) -> dict:
        """
        Analyze receipt text using Gemma AI model and extract structured information.
        Raises exception if model cannot be loaded.
        """
        logger.info("="*60)
        logger.info("🤖 Gemma AI: Starting receipt analysis")
        logger.info("="*60)
        logger.info(f"📝 Input text ({len(receipt_text)} chars):\n{receipt_text}")
        
        # Load model (will raise exception if it fails)
        self._load_model()
        
        try:
            # Create prompt for Gemma
            logger.info("📝 Creating AI prompt...")
            prompt = f"""Analyze this receipt text and extract the following information in JSON format:
- purchase: main item or store name
- amount: total amount paid (number only)
- category: one of [food, transport, bills, other]

Receipt text:
{receipt_text}

Respond ONLY with valid JSON in this exact format:
{{"purchase": "item name", "amount": 0.00, "category": "food"}}

JSON:"""

            # Tokenize input
            logger.info("🔄 Tokenizing input...")
            inputs = self.tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # Generate response
            logger.info("🧠 Generating AI response...")
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Decode response
            logger.info("📤 Decoding response...")
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            logger.info(f"🤖 AI Response:\n{response}")
            
            # Extract JSON from response
            logger.info("🔍 Extracting JSON from response...")
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                logger.info(f"📋 Extracted JSON: {json_str}")
                result = json.loads(json_str)
                
                # Validate and sanitize
                final_result = {
                    "purchase": str(result.get("purchase", "Unknown")),
                    "amount": float(result.get("amount", 0.0)),
                    "category": result.get("category", "other")
                }
                
                logger.info("="*60)
                logger.info(f"✅ AI Analysis Complete: {final_result}")
                logger.info("="*60)
                return final_result
            else:
                logger.error("❌ Failed to extract JSON from AI response")
                raise Exception("AI did not return valid JSON format")
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {str(e)}")
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Gemma analysis error: {str(e)}")
            raise Exception(f"Receipt analysis failed: {str(e)}")
    

gemma_service = GemmaService()
