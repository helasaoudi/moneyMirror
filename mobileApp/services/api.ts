import axios from 'axios';

// Backend API URL - use your computer's IP address for real device testing
// For iOS Simulator, you can use localhost
const API_URL = 'http://192.168.1.13:8005/api';

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
