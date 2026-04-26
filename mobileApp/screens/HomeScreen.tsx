import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

export default function HomeScreen({ navigation }: any) {
  const handleOpenCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      {/* Animated Receipt Icon */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/scanner-animation.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Marketing Content */}
      <Text style={styles.title}>Capture Your Receipts</Text>
      <Text style={styles.subtitle}>
        Take a picture of any receipt and let AI do the rest
      </Text>

      {/* Benefits */}
      <View style={styles.benefitsContainer}>
        <View style={styles.benefit}>
          <Ionicons name="flash" size={24} color="#FFB74D" />
          <Text style={styles.benefitText}>Instant scanning</Text>
        </View>
        <View style={styles.benefit}>
          <Ionicons name="bulb" size={24} color="#9C27B0" />
          <Text style={styles.benefitText}>AI-powered analysis</Text>
        </View>
        <View style={styles.benefit}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Smart insights</Text>
        </View>
      </View>

      {/* Main CTA Button */}
      <TouchableOpacity style={styles.cameraButton} onPress={handleOpenCamera}>
        <Ionicons name="camera" size={32} color="#fff" />
        <Text style={styles.cameraButtonText}>Scan Receipt</Text>
      </TouchableOpacity>

      {/* Secondary Info */}
      <Text style={styles.footerText}>
        No signup required • 100% free • Works offline
      </Text>
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
  animationContainer: {
    marginBottom: 32,
  },
  lottie: {
    width: 240,
    height: 240,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  benefit: {
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 24,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
