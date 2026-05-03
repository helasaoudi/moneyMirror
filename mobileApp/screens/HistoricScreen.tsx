import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHistoricData, MonthlyData } from '../services/storage';

const HistoricScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [historicData, setHistoricData] = useState<MonthlyData[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistoricData();
  }, []);

  const fetchHistoricData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getHistoricData();
      setHistoricData(data);
    } catch (error) {
      console.error('Error fetching historic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (month: string): void => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="time" size={48} color="#4CAF50" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (historicData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="archive-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Historic Data</Text>
        <Text style={styles.emptyText}>
          Past months will appear here automatically
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchHistoricData} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="archive" size={32} color="#4CAF50" />
        <Text style={styles.title}>Historic Reports</Text>
        <Text style={styles.subtitle}>Last {historicData.length} months</Text>
      </View>

      {historicData.map((monthData) => {
        const isExpanded = expandedMonths.has(monthData.month);
        const topCategories = Object.entries(monthData.categories)
          .filter(([_, amount]) => amount > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return (
          <View key={monthData.month} style={styles.monthCard}>
            <TouchableOpacity
              style={styles.monthHeader}
              onPress={() => toggleMonth(monthData.month)}
            >
              <View style={styles.monthHeaderLeft}>
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={24}
                  color="#666"
                />
                <View>
                  <Text style={styles.monthTitle}>
                    {formatMonth(monthData.month)}
                  </Text>
                  <Text style={styles.monthReceiptCount}>
                    {monthData.receipts.length} receipt
                    {monthData.receipts.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.monthTotal}>${monthData.total.toFixed(2)}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.monthDetails}>
                {/* Category Summary */}
                <View style={styles.categoriesSection}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  {topCategories.map(([category, amount]) => (
                    <View key={category} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <Ionicons
                          name={getCategoryIcon(category)}
                          size={20}
                          color={getCategoryColor(category)}
                        />
                        <Text style={styles.categoryName}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        ${amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Receipts List */}
                <View style={styles.receiptsSection}>
                  <Text style={styles.sectionTitle}>Receipts</Text>
                  {monthData.receipts.map((receipt) => (
                    <View key={receipt.id} style={styles.receiptRow}>
                      <View style={styles.receiptLeft}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: getCategoryColor(receipt.category) },
                          ]}
                        />
                        <View>
                          <Text style={styles.receiptPurchase}>
                            {receipt.purchase}
                          </Text>
                          <Text style={styles.receiptDate}>
                            {new Date(receipt.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.receiptAmount}>
                        ${receipt.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  monthCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthReceiptCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  monthTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  monthDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    paddingTop: 12,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  receiptsSection: {
    marginTop: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  receiptPurchase: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  receiptDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});

export default HistoricScreen;
