import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { getCurrentReceipts, calculateMonthlyReport, MonthlyData, getCurrentMonth, getUserProfile, UserProfile, getAIInsight as getStoredInsight, AIInsight } from '../services/storage';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  MainTabs: undefined;
  Camera: undefined;
};

type TabParamList = {
  Home: undefined;
  Report: undefined;
  Historic: undefined;
};

type ReportScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Report'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ReportScreenProps {
  navigation: ReportScreenNavigationProp;
}

interface ChartDataItem {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<MonthlyData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchReport();
    }, [])
  );

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (): Promise<void> => {
    setLoading(true);
    try {
      const receipts = await getCurrentReceipts();
      const monthlyData = calculateMonthlyReport(receipts);
      setReport(monthlyData);
      
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      
      const cachedInsight = await getStoredInsight();
      setInsight(cachedInsight);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (): ChartDataItem[] => {
    if (!report) return [];

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

    return Object.entries(report.categories)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]) // Sort by amount descending
      .map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        amount: amount,
        color: colors[category.toLowerCase()] || '#999',
        legendFontColor: '#2D1B69',
        legendFontSize: 12,
      }));
  };

  const getHighestCategory = (): [string, number] | null => {
    if (!report) return null;

    const entries = Object.entries(report.categories);
    if (entries.length === 0) return null;

    return entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/loading-coins.json')}
          autoPlay
          loop
          style={styles.loadingLottie}
        />
        <Text style={styles.loadingText}>Loading your report...</Text>
      </View>
    );
  }

  const chartData = getChartData();
  const highestCategory = getHighestCategory();

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getInsight = (): string | null => {
    if (!report) return null;
    const entries = Object.entries(report.categories);
    if (entries.length === 0) return null;
    
    const highest = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
    
    const percentage = report.total > 0 
      ? Math.round((highest[1] / report.total) * 100) 
      : 0;
    
    return `You spent ${percentage}% more on ${highest[0].charAt(0).toUpperCase() + highest[0].slice(1)} compared to last month. Consider setting a limit for next month.`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchReport} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Monthly report</Text>
        <Text style={styles.monthName}>{formatMonth(getCurrentMonth())}</Text>
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total spent</Text>
        <Text style={styles.totalAmount}>
          ${report?.total.toFixed(2) || '0.00'}
        </Text>
        {profile && (
          <View style={styles.budgetInfoRow}>
            <View style={styles.budgetChip}>
              <Text style={styles.budgetChipLabel}>Budget</Text>
              <Text style={styles.budgetChipValue}>${profile.budget.toFixed(0)}</Text>
            </View>
            <View style={[
              styles.budgetChip,
              { backgroundColor: (profile.budget - (report?.total || 0)) >= 0 ? '#E8F5E9' : '#FFE5E5' }
            ]}>
              <Text style={styles.budgetChipLabel}>Remaining</Text>
              <Text style={[
                styles.budgetChipValue,
                { color: (profile.budget - (report?.total || 0)) >= 0 ? '#4CAF50' : '#FF6B6B' }
              ]}>
                ${Math.abs(profile.budget - (report?.total || 0)).toFixed(0)}
                {(profile.budget - (report?.total || 0)) < 0 ? ' over' : ''}
              </Text>
            </View>
          </View>
        )}
      </View>

      {chartData.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={Dimensions.get('window').width - 40}
              height={240}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              center={[10, 0]}
              absolute
              hasLegend={false}
              avoidFalseZero
            />
            <View style={styles.categoryLabel}>
              <Text style={styles.categoryCount}>{report ? Object.keys(report.categories || {}).filter(k => report.categories[k] > 0).length : 0}</Text>
              <Text style={styles.categoryLabelText}>categories</Text>
            </View>
          </View>

          <View style={styles.categoryList}>
            {report &&
              Object.entries(report.categories)
                .filter(([_, amount]) => amount > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const percentage = report.total > 0 
                    ? Math.round((amount / report.total) * 100) 
                    : 0;
                  
                  return (
                    <View key={category} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <View 
                          style={[
                            styles.categoryDot,
                            { backgroundColor: getCategoryColor(category) }
                          ]}
                        />
                        <Ionicons 
                          name={getCategoryIcon(category)} 
                          size={18} 
                          color={getCategoryColor(category)} 
                          style={styles.categoryIcon}
                        />
                        <Text style={styles.categoryName}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.categoryRight}>
                        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: getCategoryColor(category) + '30' }]} />
                        <Text style={styles.categoryPercentage}>{percentage}%</Text>
                        <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })}
          </View>

          {/* AI Insight Card */}
          {insight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="sparkles" size={24} color="#7C66FF" />
                <Text style={styles.insightTitle}>AI Coach</Text>
              </View>
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ) : getInsight() ? (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={24} color="#FFB84D" />
                <Text style={styles.insightTitle}>Heads up!</Text>
              </View>
              <Text style={styles.insightText}>{getInsight()}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={80} color="#DDD" />
          <Text style={styles.emptyText}>No data yet!</Text>
          <Text style={styles.emptySubtext}>
            Start scanning receipts to see your spending breakdown
          </Text>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
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
  return icons[category.toLowerCase()] || 'cube';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
  loadingLottie: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7C66FF',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  monthName: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  totalLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  budgetInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  budgetChip: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  budgetChipLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  budgetChipValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C66FF',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryLabel: {
    position: 'absolute',
    top: '42%',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  categoryLabelText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  categoryList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D1B69',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: -120,
    height: 4,
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: 13,
    color: '#999',
    minWidth: 40,
    textAlign: 'right',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1B69',
    minWidth: 70,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#7C66FF',
    marginHorizontal: 20,
    marginBottom: 80,
    padding: 20,
    borderRadius: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  insightText: {
    fontSize: 13,
    color: '#FFF',
    lineHeight: 20,
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
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

export default ReportScreen;
