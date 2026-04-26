# MoneyMirror 💰📱

AI-powered receipt tracking app with beautiful UX and offline-first AI analysis.

## ✨ Features

- 📸 **Instant Receipt Scanning** - Snap photos of receipts with haptic feedback
- 🤖 **Free Offline AI** - Tesseract OCR + Local Gemma AI (no API rate limits!)
- 📊 **Beautiful Reports** - Monthly spending visualizations with category breakdowns
- 🎨 **Premium UX** - Onboarding flow, Lottie animations, bottom tabs navigation
- 💾 **Privacy First** - All data stored locally, AI runs on-device

## 🛠 Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Tesseract OCR** - Free offline text extraction from receipts
- **Gemma 2-2B-IT** - Local AI model for smart categorization (HuggingFace)
- **In-memory storage** - Simple list-based data storage

### Mobile App
- **React Native (Expo)** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Bottom tabs + stack navigation
- **Expo Haptics** - Premium tactile feedback
- **Lottie Animations** - Smooth, beautiful animations
- **React Native Chart Kit** - Pie chart visualizations

## 📁 Monorepo Structure

```
MoneyMirror/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── core/
│   │   │   └── data_store.py  # In-memory data storage
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── receipt_router.py
│   │   │   └── controllers/
│   │   │       └── receipt_controller.py
│   │   ├── services/
│   │   │   ├── tesseract_service.py  # Free OCR
│   │   │   └── gemma_service.py      # Local AI
│   │   └── utils/
│   │       └── config.py
│   ├── .env.example           # Environment template
│   ├── .gitignore
│   ├── requirements.txt
│   └── run.py
│
├── mobileApp/                  # React Native Expo app
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   └── ReportScreen.tsx
│   ├── services/
│   │   └── api.js
│   ├── assets/
│   │   ├── scanner-animation.json
│  🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 16+
- Tesseract OCR (`brew install tesseract` on macOS)
- Expo Go app on your phone

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

5. **Download Gemma model (one-time, ~5GB):**
   ```bash
   # Authenticate with HuggingFace
   huggingface-cli login
   
   # Model will auto-download on first use
   # Or pre-download manually in Python
   ```

6. **Run backend:**
   ```bash
   python3.11 run.py
   ```
   
   Backend runs on `http://0.0.0.0:8005`

### Mobile App Setup

1. **Navigate to mobile app:**
   ```bash
   cd mobileApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API endpoint:**
   Edit `mobileApp/services/api.js` and set your backend IP:
   ```javascript
   const API_BASE_URL = 'http://YOUR_LOCAL_IP:8005';
   ```

4. **Start Expo:**
   ```bash
   npx expo start
   ```

5. **Scan QR code** with Expo Go app on your phone

## 🎯 Usage

1. **First Launch** - See onboarding screen
2. **Home Tab** - Tap "Scan Receipt" button
3. **Camera Modal** - Take photo or choose from gallery
4. **AI Analysis** - OCR + AI categorizes the receipt
5. **Reports Tab** - View monthly spending breakdownbash
   python run.py
   ```

   Backend will start on `http://localhost:8000`

### Frontend Setup (Expo)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL:**
   - Edit `services/api.js` and update `API_URL` to your backend URL
   - For local development: `http://localhost:8000/api`
   - **For real device testing:** use your computer's IP (e.g., `http://192.168.1.100:8000/api`)

4. **Start Expo development server:**
   ```bash
   npx expo start
   ```

5. **Run on your phone:**
   - Install **"Expo Go"** app from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in your terminal with Expo Go
   - The app will load on your device!

   **Alternative:** Press `i` for iOS simulator or `a` for Android emulator (requires setup)

## API Endpoints

### POST /api/analyze
Analyze receipt image and extract spending data.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "purchase": "Grocery Store",
  "amount": 45.67,
  "category": "food"
}
```

### GET /api/report
Get monthly spending report.

**Response:**
```json
{
  "total": 234.56,
  "categories": {
    "food": 120.00,
    "transport": 50.00,
    "bills": 40.56,
    "other": 24.00
  }
}
```

## Data Flow

```
📱 Frontend (Take Picture)
    ↓
🌐 POST /api/analyze
    ↓
🤖 Gemini OCR (Extract Text)
    ↓
🧠 Gemma 4 (Analyze & Categorize)
    ↓
💾 Store in Memory
    ↓
📊 Return JSON to Frontend
    ↓
📱 Display Result & Store Locally
```

## Categories

The app categorizes spending into:
- **food** - Groceries, restaurants, cafes
- **transport** - Gas, public transit, rideshare
- **bills** - Utilities, rent, subscriptions
- **other** - Everything else

The highest spending category is highlighted in **RED** in the monthly report.

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

## Notes

- Data is stored **in memory** only (resets when server restarts)
- For production, add a database (SQLite, PostgreSQL, etc.)
- Gemma model downloads automatically from HuggingFace on first run (~5GB)
- Requires decent GPU/CPU for Gemma inference (or use cloud deployment)

## Troubleshooting

**Backend won't start:**
- Check Python version (3.9+)
- Verify all dependencies installed
- Check Gemini API key is valid

**Frontend can't connect:**
- Update API_URL in `services/api.js`
- Use computer's IP address for mobile testing
- Ensure backend is running

**Gemma model slow:**
- First run downloads model (~5GB)
- Inference may be slow on CPU
- Consider using GPU or cloud deployment

## Future Enhancements

- Database persistence
- User authentication
- Export to CSV/PDF
- Budget limits and alerts
- Receipt history view
- Multi-currency support

## License

MIT License - feel free to use and modify!

---

Built with ❤️ following KISS principles (Keep It Simple, Stupid)
