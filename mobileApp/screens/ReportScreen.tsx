import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { getMonthlyReport, MonthlyReport } from '../services/api';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  MainTabs: undefined;
  Camera: undefined;
};

type TabParamList = {
  Home: undefined;
  Report: undefined;
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
  const [report, setReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getMonthlyReport();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (): ChartDataItem[] => {
    if (!report) return [];

    const colors: { [key: string]: string } = {
      food: '#FF6384',
      transport: '#36A2EB',
      bills: '#FFCE56',
      other: '#4BC0C0',
    };

    return Object.entries(report.categories)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        amount: amount,
        color: colors[category] || '#999',
        legendFontColor: '#333',
        legendFontSize: 14,
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Report</Text>
        <TouchableOpacity onPress={fetchReport} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>
          ${report?.total.toFixed(2) || '0.00'}
        </Text>
      </View>

      {chartData.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <PieChart
              data={chartData}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>

          <View style={styles.categoryList}>
            {report &&
              Object.entries(report.categories).map(([category, amount]) => (
                <View
                  key={category}
                  style={[
                    styles.categoryItem,
                    highestCategory &&
                      highestCategory[0] === category &&
                      styles.highestCategory,
                  ]}
                >
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryAmount,
                      highestCategory &&
                        highestCategory[0] === category &&
                        styles.highestCategoryText,
                    ]}
                  >
                    ${amount.toFixed(2)}
                  </Text>
                </View>
              ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <LottieView
            source={require('../assets/empty-wallet.json')}
            autoPlay
            loop
            style={styles.emptyLottie}
          />
          <Ionicons name="sunny" size={80} color="#FFB74D" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No receipts yet!</Text>
          <Text style={styles.emptySubtext}>
            Start scanning receipts to track your spending 🌟
          </Text>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Your First Receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0', // Summer Background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  loadingLottie: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FF8A71',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#FF8A71',
  },
  totalCard: {
    backgroundColor: '#FF8A71', // Sunny Peach
    margin: 20,
    padding: 25,
    borderRadius: 25, // Rounder corners for modern feel
    shadowColor: '#FF8A71',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  highestCategory: {
    borderWidth: 0,
    backgroundColor: '#FFEAA7', // Light yellow for "high" alert
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  highestCategoryText: {
    color: '#FF8A71',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyLottie: {
    width: 250,
    height: 250,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportScreen;
