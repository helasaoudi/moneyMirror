import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCurrentReceipts,
  calculateMonthlyReport,
  clearAllData,
  Receipt,
  getUserProfile,
  UserProfile,
  getAIInsight as getStoredInsight,
  saveAIInsight,
  AIInsight,
  shouldRefreshInsight,
  buildSpendingSummary,
} from '../services/storage';
import { getAIInsight, getInsightInterval } from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const [totalSpent, setTotalSpent] = useState(0);
  const [topCategory, setTopCategory] = useState('Food');
  const [receiptsCount, setReceiptsCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchingRef = useRef(false); // Prevent duplicate calls

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      checkAndFetchInsight();
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const receipts = await getCurrentReceipts();
      const report = calculateMonthlyReport(receipts);
      const userProfile = await getUserProfile();
      
      setTotalSpent(report.total);
      setReceiptsCount(receipts.length);
      setRecentTransactions(receipts.slice(0, 3));
      setProfile(userProfile);
      
      // Find top category
      const topCat = Object.entries(report.categories)
        .sort((a, b) => b[1] - a[1])[0];
      if (topCat) {
        setTopCategory(topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndFetchInsight = async () => {
    // Load cached insight first (never show empty)
    const cached = await getStoredInsight();
    if (cached) setInsight(cached);

    // Check if we need to refresh
    try {
      const interval = await getInsightInterval();
      const needsRefresh = await shouldRefreshInsight(interval);
      
      if (needsRefresh && !insightFetchingRef.current) {
        insightFetchingRef.current = true;
        
        const summary = await buildSpendingSummary();
        // Only fetch insight if user has scanned at least 1 receipt
        if (summary && summary.receiptCount > 0) {
          // Small delay to avoid competing with scan requests on the model
          await new Promise(resolve => setTimeout(resolve, 3000));
          setInsightLoading(true);
          const response = await getAIInsight({
            budget: summary.profile.budget,
            totalSpent: summary.totalSpent,
            budgetRemaining: summary.budgetRemaining,
            budgetUsedPercent: summary.budgetUsedPercent,
            daysLeftInMonth: summary.daysLeftInMonth,
            categories: summary.categories,
            receiptCount: summary.receiptCount,
            topCategory: summary.topCategory,
            topCategoryAmount: summary.topCategoryAmount,
            trackingReason: summary.profile.trackingReason,
            goalName: summary.profile.goalName,
            goalAmount: summary.profile.goalAmount,
          });

          const newInsight: AIInsight = {
            id: Date.now().toString(),
            message: response.insight,
            type: 'weekly',
            timestamp: Date.now(),
            budgetRemaining: response.budgetRemaining,
            budgetUsedPercent: response.budgetUsedPercent,
          };

          await saveAIInsight(newInsight);
          setInsight(newInsight);
        }
        
        insightFetchingRef.current = false;
        setInsightLoading(false);
      }
    } catch (error) {
      // Silently fail — cached insight stays visible, will retry next interval
      console.log('Insight fetch skipped (server busy or unreachable), will retry later');
      insightFetchingRef.current = false;
      setInsightLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      coffee: 'cafe',
      food: 'fast-food',
      shopping: 'cart',
      transport: 'car',
      entertainment: 'film',
      bills: 'receipt',
      health: 'fitness',
      other: 'cube',
    };
    return icons[category.toLowerCase()] || 'cart';
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      coffee: '#8B4513',
      food: '#FF9B71',
      shopping: '#7C66FF',
      transport: '#4ECDC4',
      entertainment: '#FF6B9D',
      bills: '#FFD93D',
      health: '#6BCF7F',
      other: '#A8E6CF',
    };
    return colors[category.toLowerCase()] || '#A8E6CF';
  };

  const handleResetData = async () => {
    try {
      await clearAllData();
      await fetchData(); // Refresh the screen
      alert('✅ All data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('❌ Failed to clear data');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetData}
          >
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton}>
            <Ionicons name="person-circle" size={48} color="#B794F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Spent Card with Budget Progress */}
      <View style={styles.totalCard}>
        <View style={styles.totalCardHeader}>
          <Text style={styles.totalLabel}>TOTAL SPENT THIS MONTH</Text>
          {profile && (
            <Text style={styles.comparison}>
              {profile.budget - totalSpent >= 0 ? '✓' : '⚠'} ${Math.abs(profile.budget - totalSpent).toFixed(0)} {profile.budget - totalSpent >= 0 ? 'left' : 'over'}
            </Text>
          )}
        </View>
        <Text style={styles.totalAmount}>${totalSpent.toFixed(2)}</Text>
        {profile && (
          <View style={styles.budgetProgressContainer}>
            <View style={styles.budgetProgressBg}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${Math.min((totalSpent / profile.budget) * 100, 100)}%`,
                    backgroundColor: totalSpent > profile.budget ? '#FF6B6B' : totalSpent > profile.budget * 0.8 ? '#FFB84D' : '#6BCF7F',
                  },
                ]}
              />
            </View>
            <Text style={styles.budgetProgressText}>
              ${totalSpent.toFixed(0)} / ${profile.budget.toFixed(0)} budget
            </Text>
          </View>
        )}
        <Text style={styles.monthLabel}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* AI Insight Card - only show after at least 1 receipt */}
      {receiptsCount > 0 && (insight || insightLoading) && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIconCircle}>
              <Ionicons name="sparkles" size={18} color="#FFF" />
            </View>
            <Text style={styles.insightTitle}>AI Coach</Text>
            {insightLoading && <ActivityIndicator size="small" color="#7C66FF" style={{ marginLeft: 8 }} />}
          </View>
          <Text style={styles.insightMessage}>
            {insight?.message || 'Analyzing your spending patterns...'}
          </Text>
          {profile?.goalName && (
            <View style={styles.goalBadge}>
              <Ionicons name="trophy" size={14} color="#7C66FF" />
              <Text style={styles.goalBadgeText}>Goal: {profile.goalName}</Text>
              {profile.goalAmount && (
                <Text style={styles.goalAmountText}>${profile.goalAmount.toFixed(0)}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="receipt-outline" size={20} color="#7C66FF" />
          <Text style={styles.statLabel}>Top category</Text>
          <Text style={styles.statValue}>{topCategory}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="camera-outline" size={20} color="#7C66FF" />
          <Text style={styles.statLabel}>Receipts scanned</Text>
          <Text style={styles.statValue}>{receiptsCount}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getCategoryColor(transaction.category) + '20' }
                ]}>
                  <Ionicons 
                    name={getCategoryIcon(transaction.category)} 
                    size={20} 
                    color={getCategoryColor(transaction.category)} 
                  />
                </View>
                <View>
                  <Text style={styles.transactionName}>{transaction.purchase}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                      weekday: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>-${transaction.amount.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#DDD" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan Your First Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#999',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: '#7C66FF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#7C66FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  comparison: {
    fontSize: 12,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  budgetProgressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  budgetProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  budgetProgressText: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 6,
  },
  monthLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  insightCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C66FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C66FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C66FF',
  },
  insightMessage: {
    fontSize: 14,
    color: '#2D1B69',
    lineHeight: 20,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C66FF',
  },
  goalAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D1B69',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B69',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B69',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C66FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
