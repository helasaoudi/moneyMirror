import axios from 'axios';

// Backend API URL - use your computer's IP address for real device testing
// For iOS Simulator, you can use localhost
// Real Device: http://192.168.1.11:8089/api
// Simulator: http://localhost:8089/api
const API_URL = 'http://192.168.1.11:8089/api';

// Type definitions
export interface ReceiptAnalysisResult {
  purchase: string;
  amount: number;
  category: string;
}

export interface MonthlyReport {
  total: number;
  categories: {
    [key: string]: number;
  };
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Analyze receipt image
 * @param imageFile - The receipt image file
 * @returns Analysis result with purchase, amount, category
 */
export const analyzeReceipt = async (
  imageFile: ImageFile
): Promise<ReceiptAnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile as any);

    const response = await axios.post<ReceiptAnalysisResult>(
      `${API_URL}/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes for AI model processing
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    throw error;
  }
};

/**
 * Get monthly spending report
 * @returns Monthly report with total and category breakdown
 */
export const getMonthlyReport = async (): Promise<MonthlyReport> => {
  try {
    const response = await axios.get<MonthlyReport>(`${API_URL}/report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

/**
 * AI Insight response
 */
export interface InsightResponse {
  insight: string;
  budgetRemaining: number;
  budgetUsedPercent: number;
  topCategory: string;
  intervalMinutes: number;
}

/**
 * Request AI-generated financial insight
 */
export const getAIInsight = async (spendingData: {
  budget: number;
  totalSpent: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  daysLeftInMonth: number;
  categories: { [key: string]: number };
  receiptCount: number;
  topCategory: string;
  topCategoryAmount: number;
  trackingReason: string;
  goalName?: string;
  goalAmount?: number;
}): Promise<InsightResponse> => {
  try {
    const response = await axios.post<InsightResponse>(
      `${API_URL}/insights`,
      spendingData,
      { timeout: 180000 } // 3 min for AI processing
    );
    return response.data;
  } catch (error) {
    console.error('Error getting AI insight:', error);
    throw error;
  }
};

/**
 * Get the configured insight refresh interval
 */
export const getInsightInterval = async (): Promise<number> => {
  try {
    const response = await axios.get<{ intervalMinutes: number }>(
      `${API_URL}/config/insight-interval`,
      { timeout: 5000 }
    );
    return response.data.intervalMinutes;
  } catch (error) {
    console.error('Error getting insight interval:', error);
    return 5; // Default to 5 minutes
  }
};
