import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Receipt {
  id: string;
  purchase: string;
  amount: number;
  category: string;
  timestamp: number;
  month: string; // Format: "YYYY-MM"
}

export interface MonthlyData {
  month: string;
  receipts: Receipt[];
  total: number;
  categories: { [key: string]: number };
}

export interface UserProfile {
  budget: number;
  trackingReason: 'save_for_goal' | 'just_track' | 'reduce_spending';
  goalName?: string;
  goalAmount?: number;
  setupComplete: boolean;
}

export interface AIInsight {
  id: string;
  message: string;
  type: 'weekly' | 'monthly';
  timestamp: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
}

const CURRENT_RECEIPTS_KEY = '@moneymirror_current_receipts';
const HISTORIC_DATA_KEY = '@moneymirror_historic_data';
const USER_PROFILE_KEY = '@moneymirror_user_profile';
const AI_INSIGHT_KEY = '@moneymirror_ai_insight';
const LAST_INSIGHT_TIME_KEY = '@moneymirror_last_insight_time';

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Add a new receipt to current month
 */
export const addReceipt = async (
  purchase: string,
  amount: number,
  category: string
): Promise<Receipt> => {
  try {
    const currentMonth = getCurrentMonth();
    const receipt: Receipt = {
      id: Date.now().toString(),
      purchase,
      amount,
      category,
      timestamp: Date.now(),
      month: currentMonth,
    };

    // Get existing receipts
    const receipts = await getCurrentReceipts();
    
    // Check if month changed - if so, archive old data first
    if (receipts.length > 0 && receipts[0].month !== currentMonth) {
      await archiveCurrentMonth();
      // After archiving, receipts array should be empty
      receipts.length = 0;
    }
    
    // Add new receipt
    receipts.unshift(receipt); // Add to beginning
    
    // Save
    await AsyncStorage.setItem(CURRENT_RECEIPTS_KEY, JSON.stringify(receipts));
    
    return receipt;
  } catch (error) {
    console.error('Error adding receipt:', error);
    throw error;
  }
};

/**
 * Get all receipts for current month
 */
export const getCurrentReceipts = async (): Promise<Receipt[]> => {
  try {
    const data = await AsyncStorage.getItem(CURRENT_RECEIPTS_KEY);
    if (!data) return [];
    
    const receipts: Receipt[] = JSON.parse(data);
    const currentMonth = getCurrentMonth();
    
    // Auto-archive if month changed
    if (receipts.length > 0 && receipts[0].month !== currentMonth) {
      await archiveCurrentMonth();
      return [];
    }
    
    return receipts;
  } catch (error) {
    console.error('Error getting current receipts:', error);
    return [];
  }
};

/**
 * Calculate monthly report from receipts
 */
export const calculateMonthlyReport = (receipts: Receipt[]): MonthlyData => {
  const currentMonth = getCurrentMonth();
  const categories: { [key: string]: number } = {
    food: 0,
    transport: 0,
    bills: 0,
    other: 0,
  };
  
  let total = 0;
  
  receipts.forEach((receipt) => {
    total += receipt.amount;
    categories[receipt.category] = (categories[receipt.category] || 0) + receipt.amount;
  });
  
  return {
    month: currentMonth,
    receipts,
    total,
    categories,
  };
};

/**
 * Archive current month's data to historic
 */
export const archiveCurrentMonth = async (): Promise<void> => {
  try {
    const receipts = await getCurrentReceipts();
    if (receipts.length === 0) return;
    
    const monthlyData = calculateMonthlyReport(receipts);
    
    // Get existing historic data
    const historicData = await getHistoricData();
    
    // Add current month to historic (at beginning)
    historicData.unshift(monthlyData);
    
    // Keep only last 12 months
    const limitedHistoric = historicData.slice(0, 12);
    
    // Save historic data
    await AsyncStorage.setItem(HISTORIC_DATA_KEY, JSON.stringify(limitedHistoric));
    
    // Clear current receipts
    await AsyncStorage.setItem(CURRENT_RECEIPTS_KEY, JSON.stringify([]));
    
    console.log(`📦 Archived month ${monthlyData.month} with ${receipts.length} receipts`);
  } catch (error) {
    console.error('Error archiving month:', error);
    throw error;
  }
};

/**
 * Get all historic monthly data (last 12 months)
 */
export const getHistoricData = async (): Promise<MonthlyData[]> => {
  try {
    const data = await AsyncStorage.getItem(HISTORIC_DATA_KEY);
    if (!data) return [];
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting historic data:', error);
    return [];
  }
};

/**
 * Clear all data (for testing/reset)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CURRENT_RECEIPTS_KEY,
      HISTORIC_DATA_KEY,
      AI_INSIGHT_KEY,
      LAST_INSIGHT_TIME_KEY,
    ]);
    console.log('🗑️ All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// ==================== USER PROFILE ====================

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    console.log('👤 Profile saved:', profile);
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

export const isSetupComplete = async (): Promise<boolean> => {
  const profile = await getUserProfile();
  return profile?.setupComplete === true;
};

// ==================== AI INSIGHTS ====================

export const saveAIInsight = async (insight: AIInsight): Promise<void> => {
  try {
    await AsyncStorage.setItem(AI_INSIGHT_KEY, JSON.stringify(insight));
    await AsyncStorage.setItem(LAST_INSIGHT_TIME_KEY, Date.now().toString());
    console.log('🧠 AI Insight saved');
  } catch (error) {
    console.error('Error saving insight:', error);
  }
};

export const getAIInsight = async (): Promise<AIInsight | null> => {
  try {
    const data = await AsyncStorage.getItem(AI_INSIGHT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting insight:', error);
    return null;
  }
};

export const getLastInsightTime = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(LAST_INSIGHT_TIME_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    return 0;
  }
};

export const shouldRefreshInsight = async (intervalMinutes: number): Promise<boolean> => {
  const lastTime = await getLastInsightTime();
  if (lastTime === 0) return true; // Never fetched
  const elapsed = Date.now() - lastTime;
  const intervalMs = intervalMinutes * 60 * 1000;
  return elapsed >= intervalMs;
};

/**
 * Build a spending summary for sending to the AI
 */
export const buildSpendingSummary = async (): Promise<{
  profile: UserProfile;
  currentMonth: string;
  totalSpent: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  daysLeftInMonth: number;
  categories: { [key: string]: number };
  receiptCount: number;
  topCategory: string;
  topCategoryAmount: number;
}| null> => {
  const profile = await getUserProfile();
  if (!profile) return null;

  const receipts = await getCurrentReceipts();
  const report = calculateMonthlyReport(receipts);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const budgetRemaining = profile.budget - report.total;
  const budgetUsedPercent = profile.budget > 0 ? Math.round((report.total / profile.budget) * 100) : 0;

  // Find top category
  const catEntries = Object.entries(report.categories).filter(([_, v]) => v > 0);
  const topCat = catEntries.length > 0
    ? catEntries.reduce((max, cur) => cur[1] > max[1] ? cur : max)
    : ['none', 0];

  return {
    profile,
    currentMonth: getCurrentMonth(),
    totalSpent: report.total,
    budgetRemaining,
    budgetUsedPercent,
    daysLeftInMonth: daysLeft,
    categories: report.categories,
    receiptCount: receipts.length,
    topCategory: topCat[0] as string,
    topCategoryAmount: topCat[1] as number,
  };
};
