import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen({ navigation }: any) {
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('BudgetSetup');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      navigation.replace('BudgetSetup');
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Icon */}
      <View style={styles.iconContainer}>
        <LottieView
          source={require('../assets/scanner-animation.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>Welcome to MoneyMirror</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Track your spending effortlessly with AI-powered receipt scanning
      </Text>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="camera" size={32} color="#4CAF50" />
          <Text style={styles.featureText}>Scan receipts instantly</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="analytics" size={32} color="#2196F3" />
          <Text style={styles.featureText}>Track your expenses</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="shield-checkmark" size={32} color="#FF9800" />
          <Text style={styles.featureText}>AI-powered analysis</Text>
        </View>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={24} color="#fff" style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 40,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});
