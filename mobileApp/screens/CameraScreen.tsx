import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { analyzeReceipt, ReceiptAnalysisResult } from '../services/api';
import { addReceipt } from '../services/storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Camera: undefined;
  Report: undefined;
  Historic: undefined;
};

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
  onReceiptAdded?: (result: ReceiptAnalysisResult) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  navigation,
  onReceiptAdded,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('Food');

  const CATEGORIES = ['Coffee', 'Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Health', 'Other'];

  const handleManualSave = async () => {
    const name = manualName.trim();
    const amount = parseFloat(manualAmount);
    if (!name || isNaN(amount) || amount <= 0) {
      Alert.alert('Missing info', 'Please enter a name and a valid amount');
      return;
    }
    try {
      await addReceipt(name, amount, manualCategory);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', `${name} - $${amount.toFixed(2)} added`, [
        { text: 'OK', onPress: () => {
          setManualName('');
          setManualAmount('');
          setManualCategory('Food');
          navigation.navigate('Home' as any);
        }}
      ]);
    } catch (error) {
      console.error('Manual save error:', error);
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  const pickImage = async (): Promise<void> => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await handleAnalyze(result.assets[0].uri);
    }
  };

  const takePicture = async (): Promise<void> => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    // Take picture
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await handleAnalyze(result.assets[0].uri);
    }
  };

  const handleAnalyze = async (imageUri: string): Promise<void> => {
    setLoading(true);
    try {
      // Create file object from URI
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const file = {
        uri: imageUri,
        name: filename,
        type: type,
      };

      // Analyze receipt
      const result = await analyzeReceipt(file);
      setAnalysisResult(result);
      setSelectedCategory(result.category);

      // Premium haptic feedback on success!
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to analyze receipt';
      Alert.alert('Error', errorMessage);
      setSelectedImage(null);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndSave = async (): Promise<void> => {
    if (!analysisResult) return;

    try {
      // Save to persistent storage with potentially updated category
      await addReceipt(analysisResult.purchase, analysisResult.amount, selectedCategory);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      // Reset state for next scan
      setSelectedImage(null);
      setLoading(false);
      setAnalysisResult(null);
      setSelectedCategory('');

      // Navigate to Reports
      if (onReceiptAdded) onReceiptAdded(analysisResult);
      navigation.navigate('Report' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to save receipt');
      console.error(error);
    }
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
    return colors[category.toLowerCase()] || '#6BCF7F';
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>{mode === 'scan' ? 'Scan receipt' : 'Add manually'}</Text>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'scan' && styles.modeButtonActive]}
            onPress={() => setMode('scan')}
          >
            <Ionicons name="scan" size={18} color={mode === 'scan' ? '#FFF' : '#7C66FF'} />
            <Text style={[styles.modeButtonText, mode === 'scan' && styles.modeButtonTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
            onPress={() => setMode('manual')}
          >
            <Ionicons name="create" size={18} color={mode === 'manual' ? '#FFF' : '#7C66FF'} />
            <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>Manual</Text>
          </TouchableOpacity>
        </View>

        {/* ===== MANUAL MODE ===== */}
        {mode === 'manual' && (
          <View style={styles.manualSection}>
            <TextInput
              style={styles.manualInput}
              placeholder="What did you buy? (e.g. Starbucks Coffee)"
              placeholderTextColor="#BBB"
              value={manualName}
              onChangeText={setManualName}
            />
            <View style={styles.amountInputRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#BBB"
                keyboardType="decimal-pad"
                value={manualAmount}
                onChangeText={setManualAmount}
              />
            </View>

            <Text style={styles.categoryPickerLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    manualCategory === cat && { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) },
                  ]}
                  onPress={() => {
                    setManualCategory(cat);
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons
                    name={getCategoryIcon(cat)}
                    size={16}
                    color={manualCategory === cat ? '#FFF' : getCategoryColor(cat)}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      manualCategory === cat && { color: '#FFF' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                console.log('Save button pressed', manualName, manualAmount, manualCategory);
                handleManualSave();
              }}
            >
              <Text style={styles.confirmButtonText}>Save Receipt →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== SCAN MODE ===== */}
        {mode === 'scan' && (
        <>
        {/* Camera Viewfinder Area */}
        <View style={styles.cameraFrame}>
          <View style={styles.frameCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.receiptImage} />
          ) : (
            <Ionicons name="document-text-outline" size={60} color="#D1C4E9" />
          )}
        </View>

        <Text style={styles.instructionText}>
          Point your camera at the receipt
        </Text>

        {/* Status Message */}
        {loading && (
          <View style={styles.statusMessage}>
            <ActivityIndicator size="small" color="#FFB84D" />
            <Text style={styles.statusText}>Receipt detected — AI analyzing...</Text>
          </View>
        )}

        {analysisResult && !loading && (
          <>
            <View style={styles.statusMessage}>
              <Ionicons name="checkmark-circle" size={18} color="#6BCF7F" />
              <Text style={[styles.statusText, { color: '#6BCF7F' }]}>
                Receipt detected — AI analyzing...
              </Text>
            </View>

            {/* AI Scan Result */}
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>AI SCAN RESULT</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Store</Text>
                <Text style={styles.resultValue}>{analysisResult.purchase}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Date</Text>
                <Text style={styles.resultValue}>
                  {new Date().toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total</Text>
                <Text style={styles.resultValue}>
                  ${analysisResult.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Category</Text>
                <TouchableOpacity 
                  style={styles.categoryBadge}
                  onPress={() => {
                    // Could add category picker here
                    Alert.alert('Category', 'Tap to change category (feature coming soon)');
                  }}
                >
                  <Ionicons 
                    name={getCategoryIcon(selectedCategory)} 
                    size={16} 
                    color={getCategoryColor(selectedCategory)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(selectedCategory) }]}>
                    {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmAndSave}
            >
              <Text style={styles.confirmButtonText}>Confirm & Save →</Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>Wrong category? Tap to correct it</Text>
          </>
        )}

        {/* Action Buttons (when no scan yet) */}
        {!selectedImage && !loading && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                takePicture();
              }}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                pickImage();
              }}
            >
              <Ionicons name="images" size={24} color="#7C66FF" />
              <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
        </>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B69',
    textAlign: 'center',
    marginBottom: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: '#7C66FF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C66FF',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  manualSection: {
    gap: 16,
  },
  manualInput: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D1B69',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dollarSign: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C66FF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D1B69',
    paddingVertical: 14,
  },
  categoryPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D1B69',
  },
  cameraFrame: {
    backgroundColor: '#E8DFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    position: 'relative',
    marginBottom: 16,
  },
  frameCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#7C66FF',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 16,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  instructionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 13,
    color: '#FFB84D',
    fontWeight: '500',
  },
  resultSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 11,
    color: '#7C66FF',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultLabel: {
    fontSize: 14,
    color: '#7C66FF',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#2D1B69',
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#7C66FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7C66FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#7C66FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#7C66FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#7C66FF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;
