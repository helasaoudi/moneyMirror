import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { saveUserProfile, UserProfile } from '../services/storage';

const TRACKING_REASONS = [
  {
    id: 'save_for_goal' as const,
    label: 'Save for a goal',
    icon: 'trophy' as const,
    description: 'I want to save money for something specific',
  },
  {
    id: 'just_track' as const,
    label: 'Just track spending',
    icon: 'bar-chart' as const,
    description: 'I want to see where my money goes',
  },
  {
    id: 'reduce_spending' as const,
    label: 'Reduce spending',
    icon: 'trending-down' as const,
    description: 'I want to spend less each month',
  },
];

export default function BudgetSetupScreen({ navigation }: any) {
  const [step, setStep] = useState(1); // 1: budget, 2: reason, 3: goal (optional)
  const [budget, setBudget] = useState('');
  const [reason, setReason] = useState<UserProfile['trackingReason'] | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1 && parseFloat(budget) > 0) {
      setStep(2);
    } else if (step === 2 && reason) {
      if (reason === 'save_for_goal') {
        setStep(3);
      } else {
        handleSave();
      }
    } else if (step === 3) {
      handleSave();
    }
  };

  const handleSave = async () => {
    try {
      const profile: UserProfile = {
        budget: parseFloat(budget),
        trackingReason: reason!,
        goalName: goalName || undefined,
        goalAmount: goalAmount ? parseFloat(goalAmount) : undefined,
        setupComplete: true,
      };
      await saveUserProfile(profile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const canProceed = () => {
    if (step === 1) return parseFloat(budget) > 0;
    if (step === 2) return reason !== null;
    if (step === 3) return goalName.length > 0;
    return false;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step ? styles.progressDotActive : {},
                s < step ? styles.progressDotDone : {},
              ]}
            />
          ))}
        </View>

        {/* Step 1: Budget */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet" size={40} color="#7C66FF" />
            </View>
            <Text style={styles.stepTitle}>Set your monthly budget</Text>
            <Text style={styles.stepSubtitle}>
              How much do you plan to spend each month?
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="0.00"
                placeholderTextColor="#CCC"
                keyboardType="decimal-pad"
                value={budget}
                onChangeText={setBudget}
                autoFocus
              />
            </View>
            <Text style={styles.hint}>You can change this later in settings</Text>
          </View>
        )}

        {/* Step 2: Tracking Reason */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="bulb" size={40} color="#7C66FF" />
            </View>
            <Text style={styles.stepTitle}>Why are you tracking?</Text>
            <Text style={styles.stepSubtitle}>
              This helps our AI give you better advice
            </Text>
            <View style={styles.reasonList}>
              {TRACKING_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reasonCard,
                    reason === r.id ? styles.reasonCardActive : {},
                  ]}
                  onPress={() => {
                    setReason(r.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <View
                    style={[
                      styles.reasonIcon,
                      reason === r.id ? styles.reasonIconActive : {},
                    ]}
                  >
                    <Ionicons
                      name={r.icon}
                      size={24}
                      color={reason === r.id ? '#FFF' : '#7C66FF'}
                    />
                  </View>
                  <View style={styles.reasonText}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        reason === r.id ? styles.reasonLabelActive : {},
                      ]}
                    >
                      {r.label}
                    </Text>
                    <Text style={styles.reasonDescription}>{r.description}</Text>
                  </View>
                  {reason === r.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#7C66FF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Goal details */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="trophy" size={40} color="#7C66FF" />
            </View>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>
              Tell us what you're saving for — our AI will help you stay on track
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. New Car, Vacation, Emergency Fund"
              placeholderTextColor="#CCC"
              value={goalName}
              onChangeText={setGoalName}
              autoFocus
            />
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="Target amount (optional)"
                placeholderTextColor="#CCC"
                keyboardType="decimal-pad"
                value={goalAmount}
                onChangeText={setGoalAmount}
              />
            </View>
          </View>
        )}

        {/* Next / Finish button */}
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() ? styles.nextButtonDisabled : {}]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 || (step === 2 && reason !== 'save_for_goal')
              ? "Let's go!"
              : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Back button */}
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#7C66FF',
  },
  progressDotDone: {
    backgroundColor: '#B794F6',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B69',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C66FF',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1B69',
    paddingVertical: 16,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#2D1B69',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hint: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 8,
  },
  reasonList: {
    width: '100%',
    gap: 12,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonCardActive: {
    borderColor: '#7C66FF',
    backgroundColor: '#F8F5FF',
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reasonIconActive: {
    backgroundColor: '#7C66FF',
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B69',
    marginBottom: 2,
  },
  reasonLabelActive: {
    color: '#7C66FF',
  },
  reasonDescription: {
    fontSize: 12,
    color: '#999',
  },
  nextButton: {
    backgroundColor: '#7C66FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: '#7C66FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#D0C4FF',
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  backButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});
