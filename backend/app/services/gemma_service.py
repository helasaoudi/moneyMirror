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
    
    def _extract_amount_from_text(self, text: str) -> float:
        """
        Extract amount from receipt text using regex patterns.
        Looks for common patterns like "Total 29,96" or "Montant: 29.96"
        """
        import re
        
        # Patterns to look for (in order of priority)
        patterns = [
            r'(?:total|montant|amount|sum|grand total)[\s:]*([0-9]+[,.]?[0-9]*)',  # Total/Montant followed by number
            r'(?:total|montant|amount)[\s:]+(?:[A-Z]+\s+)?([0-9]+[,.]?[0-9]*)',   # With currency code
            r'([0-9]+[,.][0-9]{2})\s*(?:EUR|USD|\$|TND|€)',  # Number before currency
            r'(?:EUR|USD|\$|TND|€)\s*([0-9]+[,.][0-9]{2})',  # Currency before number
            r'\btotal\b.*?([0-9]+[,.][0-9]{2})',  # Total anywhere with 2 decimal places
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    amount_str = match.group(1).replace(',', '.')  # Convert European format
                    amount = float(amount_str)
                    if amount > 0:
                        logger.info(f"📊 Regex found amount: {amount} (pattern: {pattern})")
                        return amount
                except (ValueError, IndexError):
                    continue
        
        logger.warning("⚠️  No amount found with regex patterns")
        return 0.0
    
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
- purchase: main item or store name (look for store/business name at the top)
- amount: total amount paid (look for words like "Total", "TOTAL", "Montant", "Amount", "MONTANT")
  * Convert European format (29,96) to American format (29.96)
  * Ignore currency symbols (EUR, $, TND, etc.)
  * Return as decimal number only
- category: one of [Coffee, Food, Shopping, Transport, Entertainment, Bills, Health, Other]

Receipt text:
{receipt_text}

IMPORTANT: Look carefully for the total amount - it may have a comma instead of a decimal point (e.g., "29,96" means 29.96).

Respond ONLY with valid JSON in this exact format:
{{"purchase": "Store Name", "amount": 29.96, "category": "Shopping"}}

JSON:"""

            # Tokenize input
            logger.info("🔄 Tokenizing input...")
            inputs = self.tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # Generate response (optimized for CPU speed)
            logger.info("🧠 Generating AI response...")
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=100,  # Increased slightly to allow better reasoning
                temperature=0.2,     # Even lower temperature for more deterministic output
                do_sample=False,     # Greedy decoding - much faster than sampling
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Decode response
            logger.info("📤 Decoding response...")
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            logger.info(f"🤖 AI Response:\n{response}")
            
            # Extract JSON from response (skip the prompt, get AI's actual response)
            logger.info("🔍 Extracting JSON from response...")
            
            # Find JSON after "JSON:" marker to avoid extracting the example from prompt
            json_marker = response.rfind("JSON:")
            search_text = response[json_marker:] if json_marker != -1 else response
            
            # Find the last occurrence of JSON (the AI's actual response)
            json_start = search_text.rfind("{")
            json_end = search_text.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = search_text[json_start:json_end].strip()
                logger.info(f"📋 Extracted JSON: {json_str}")
                
                try:
                    result = json.loads(json_str)
                    
                    # Validate and sanitize
                    final_result = {
                        "purchase": str(result.get("purchase", "Unknown")),
                        "amount": float(result.get("amount", 0.0)),
                        "category": result.get("category", "other")
                    }
                    
                    # If amount is 0, try to extract from original text using regex
                    if final_result["amount"] == 0.0:
                        logger.warning("⚠️  AI returned amount 0.0, attempting regex extraction from receipt text...")
                        amount = self._extract_amount_from_text(receipt_text)
                        if amount > 0:
                            final_result["amount"] = amount
                            logger.info(f"✅ Regex extraction successful: {amount}")
                    
                    logger.info("="*60)
                    logger.info(f"✅ AI Analysis Complete: {final_result}")
                    logger.info("="*60)
                    return final_result
                    
                except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
                    logger.warning(f"⚠️  JSON parsing failed: {parse_error}")
                    logger.warning(f"⚠️  Attempting fallback parsing...")
                    
                    # Fallback: Use simple pattern matching
                    import re
                    purchase_match = re.search(r'"purchase":\s*"([^"]*)"', json_str)
                    amount_match = re.search(r'"amount":\s*([0-9.]+)', json_str)
                    category_match = re.search(r'"category":\s*"([^"]*)"', json_str)
                    
                    final_result = {
                        "purchase": purchase_match.group(1) if purchase_match else "Receipt",
                        "amount": float(amount_match.group(1)) if amount_match else 0.0,
                        "category": category_match.group(1) if category_match else "other"
                    }
                    
                    logger.info(f"✅ Fallback parsing successful: {final_result}")
                    return final_result
            else:
                logger.error("❌ No JSON found in AI response")
                # Return default result instead of failing
                logger.warning("⚠️  Using default fallback result")
                return {
                    "purchase": "Receipt",
                    "amount": 0.0,
                    "category": "other"
                }
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {str(e)}")
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Gemma analysis error: {str(e)}")
            raise Exception(f"Receipt analysis failed: {str(e)}")

    def generate_insight(self, spending_data: dict) -> dict:
        """
        Generate personalized financial advice based on user's spending data.
        """
        logger.info("="*60)
        logger.info("🧠 Gemma AI: Generating personalized insight")
        logger.info("="*60)
        logger.info(f"📊 Spending data: {json.dumps(spending_data, indent=2)}")

        self._load_model()

        try:
            # Build rich context for the AI
            budget = spending_data.get("budget", 0)
            total_spent = spending_data.get("totalSpent", 0)
            budget_remaining = spending_data.get("budgetRemaining", 0)
            budget_used_pct = spending_data.get("budgetUsedPercent", 0)
            days_left = spending_data.get("daysLeftInMonth", 15)
            categories = spending_data.get("categories", {})
            top_category = spending_data.get("topCategory", "unknown")
            top_amount = spending_data.get("topCategoryAmount", 0)
            reason = spending_data.get("trackingReason", "just_track")
            goal_name = spending_data.get("goalName", "")
            goal_amount = spending_data.get("goalAmount", 0)
            receipt_count = spending_data.get("receiptCount", 0)

            # Build category breakdown string
            cat_lines = []
            for cat, amt in categories.items():
                if amt > 0:
                    cat_lines.append(f"  - {cat}: ${amt:.2f}")
            cat_breakdown = "\n".join(cat_lines) if cat_lines else "  No spending yet"

            # Calculate timeline context
            import datetime
            now = datetime.datetime.now()
            days_in_month = (datetime.datetime(now.year, now.month % 12 + 1, 1) - datetime.timedelta(days=1)).day if now.month < 12 else 31
            day_of_month = now.day
            days_elapsed = day_of_month
            month_progress_pct = int((days_elapsed / days_in_month) * 100)
            daily_budget = budget / days_in_month if days_in_month > 0 else 0
            ideal_spent = daily_budget * days_elapsed
            spending_pace = "under" if total_spent < ideal_spent else "over"
            pace_diff = abs(total_spent - ideal_spent)

            # Calculate potential monthly savings per category
            savings_tips = []
            for cat, amt in categories.items():
                if amt > 0:
                    projected = (amt / max(days_elapsed, 1)) * days_in_month
                    if cat.lower() in ['food', 'coffee']:
                        save_pct = 0.4  # cooking at home saves ~40%
                        saved = projected * save_pct
                        savings_tips.append(f"  - {cat}: projected ${projected:.0f}/month. Cooking at home could save ~${saved:.0f}")
                    elif cat.lower() == 'shopping':
                        save_pct = 0.5
                        saved = projected * save_pct
                        savings_tips.append(f"  - {cat}: projected ${projected:.0f}/month. A no-buy challenge could save ~${saved:.0f}")
                    elif cat.lower() == 'entertainment':
                        save_pct = 0.3
                        saved = projected * save_pct
                        savings_tips.append(f"  - {cat}: projected ${projected:.0f}/month. Free alternatives could save ~${saved:.0f}")
                    elif cat.lower() == 'transport':
                        save_pct = 0.25
                        saved = projected * save_pct
                        savings_tips.append(f"  - {cat}: projected ${projected:.0f}/month. Walking/biking short trips could save ~${saved:.0f}")

            savings_section = "\n".join(savings_tips) if savings_tips else "  No savings opportunities identified yet"

            # Build goal context
            goal_context = ""
            if reason == "save_for_goal" and goal_name:
                monthly_savings = budget - total_spent if budget > total_spent else 0
                projected_monthly = budget - ((total_spent / max(days_elapsed, 1)) * days_in_month)
                months_to_goal = int(goal_amount / max(projected_monthly, 1)) if projected_monthly > 0 and goal_amount > 0 else 0
                goal_context = f"""
Goal: Save for {goal_name} (target: ${goal_amount:.0f})
- If user keeps this spending pace, projected savings this month: ${max(projected_monthly, 0):.0f}
- At this rate, reaching the goal would take ~{months_to_goal} months
- Budget remaining (${budget_remaining:.0f}) is what's LEFT TO SPEND, not savings"""
            elif reason == "reduce_spending":
                goal_context = "\nGoal: Reduce overall spending month over month."
            else:
                goal_context = "\nGoal: Track where money goes and find savings opportunities."

            prompt = f"""You are a smart personal finance recommendation agent. Your job is to give ONE specific, actionable money-saving tip based on the user's actual spending data. Help them spend less so they can reach their goal faster.

Monthly budget: ${budget:.2f}
Spent so far: ${total_spent:.2f} | Remaining: ${budget_remaining:.2f}
Day {day_of_month} of {days_in_month} ({month_progress_pct}% through month) | {days_left} days left
Pace: ${pace_diff:.0f} {spending_pace} ideal (ideal by now: ${ideal_spent:.0f})

Top category: {top_category} (${top_amount:.2f})
Category breakdown:
{cat_breakdown}

Savings opportunities:
{savings_section}
{goal_context}

Give ONE specific recommendation (2-3 sentences max):
- Pick their HIGHEST spending category and give a concrete tip to reduce it
- Include a dollar amount they could save (e.g. "If you cook at home 3x this week, you could save ~$45")
- Connect the savings to their goal (e.g. "That's $45 closer to your Car fund!")
- Be warm, specific, and motivating — not generic
- Do NOT use markdown

Recommendation:"""

            logger.info("📝 Insight prompt created")
            logger.info("🔄 Tokenizing...")
            inputs = self.tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}

            logger.info("🧠 Generating insight...")
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=120,
                temperature=0.5,
                do_sample=True,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id
            )

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            logger.info(f"🤖 Raw response:\n{response}")

            # Extract just the advice part (after "Recommendation:" or "Advice:")
            advice_marker = response.rfind("Recommendation:")
            if advice_marker != -1:
                advice = response[advice_marker + len("Recommendation:"):].strip()
            else:
                advice_marker = response.rfind("Advice:")
                if advice_marker != -1:
                    advice = response[advice_marker + len("Advice:"):].strip()
                else:
                    advice = response.strip()

            # Clean up: take first 2-3 sentences
            sentences = advice.replace('\n', ' ').split('.')
            clean_sentences = [s.strip() for s in sentences if len(s.strip()) > 10][:3]
            advice = '. '.join(clean_sentences) + '.' if clean_sentences else advice[:200]

            # Remove any markdown
            advice = advice.replace('*', '').replace('#', '').replace('`', '')

            result = {
                "insight": advice,
                "source": "gemma_ai",
                "budgetRemaining": budget_remaining,
                "budgetUsedPercent": budget_used_pct,
                "topCategory": top_category,
                "intervalMinutes": config.INSIGHT_INTERVAL_MINUTES,
            }

            logger.info("="*60)
            logger.info(f"✅ Insight generated: {result['insight'][:100]}...")
            logger.info("="*60)
            return result

        except Exception as e:
            logger.error(f"❌ Insight generation error: {str(e)}")
            # Return a helpful fallback instead of crashing
            fallback = self._generate_fallback_insight(spending_data)
            return fallback

    def _generate_fallback_insight(self, spending_data: dict) -> dict:
        """Generate a basic insight without AI when model fails."""
        import datetime
        budget = spending_data.get("budget", 0)
        total_spent = spending_data.get("totalSpent", 0)
        budget_remaining = budget - total_spent
        budget_used_pct = int((total_spent / budget) * 100) if budget > 0 else 0
        top_category = spending_data.get("topCategory", "other")
        goal_name = spending_data.get("goalName", "")
        days_left = spending_data.get("daysLeftInMonth", 15)
        
        now = datetime.datetime.now()
        day_of_month = now.day
        days_in_month = (datetime.datetime(now.year, now.month % 12 + 1, 1) - datetime.timedelta(days=1)).day if now.month < 12 else 31
        month_pct = int((day_of_month / days_in_month) * 100)

        if budget_used_pct > 90:
            msg = f"Heads up! You've used {budget_used_pct}% of your budget with {days_left} days left. Try to limit spending this week."
        elif budget_used_pct > month_pct + 20:
            msg = f"You've used {budget_used_pct}% of your budget but we're only {month_pct}% through the month. Consider slowing down on {top_category}."
        elif budget_used_pct <= month_pct:
            msg = f"Great pace! Day {day_of_month} and only {budget_used_pct}% of your budget used. You still have ${budget_remaining:.0f} for the rest of the month."
        else:
            msg = f"You're at {budget_used_pct}% of your budget on day {day_of_month}. Staying mindful of {top_category} spending will help."

        if goal_name:
            msg += f" Keep it up — every dollar saved brings you closer to your {goal_name}!"

        return {
            "insight": msg,
            "source": "fallback",
            "budgetRemaining": budget_remaining,
            "budgetUsedPercent": budget_used_pct,
            "topCategory": top_category,
            "intervalMinutes": config.INSIGHT_INTERVAL_MINUTES,
        }
    

gemma_service = GemmaService()
