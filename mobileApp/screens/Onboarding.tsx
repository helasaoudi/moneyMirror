import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '1', title: 'Mirror Your Wealth', desc: 'See where every cent goes with a simple scan.', color: '#FF8A71' },
  { id: '2', title: 'Smart Categorization', desc: 'We automatically group your spending.', color: '#B2EBF2' },
  { id: '3', title: 'Summer Savings', desc: 'Keep your budget as bright as the sun!', color: '#FFD97D' },
];

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <FlatList
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
             <View style={[styles.circle, { backgroundColor: item.color }]} />
             <Text style={styles.oTitle}>{item.title}</Text>
             <Text style={styles.oDesc}>{item.desc}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.getStarted} onPress={onComplete}>
        <Text style={styles.buttonText}>Start Tracking</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  circle: { width: 200, height: 200, borderRadius: 100, marginBottom: 40 },
  oTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3436', textAlign: 'center' },
  oDesc: { fontSize: 16, color: '#636E72', textAlign: 'center', marginTop: 15 },
  getStarted: { backgroundColor: '#FF8A71', padding: 20, margin: 40, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});