import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeReceipt, ReceiptAnalysisResult } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Camera: undefined;
  Report: undefined;
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

      // Premium haptic feedback on success!
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      // Show result
      Alert.alert(
        'Receipt Analyzed!',
        `Purchase: ${result.purchase}\nAmount: $${result.amount.toFixed(2)}\nCategory: ${result.category}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onReceiptAdded) onReceiptAdded(result);
              setSelectedImage(null);
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to analyze receipt';
      Alert.alert('Error', errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Close button for modal */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>MoneyMirror</Text>
      <Text style={styles.subtitle}>Scan your receipts</Text>

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
      )}

      {loading ? (
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/scanner-animation.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.loadingText}>Analyzing receipt...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              takePicture();
            }}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              pickImage();
            }}
          >
            <Ionicons name="images" size={24} color="#fff" />
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.buttonText, styles.buttonOutlineText]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutlineText: {
    color: '#4CAF50',
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default CameraScreen;
