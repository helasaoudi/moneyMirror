import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './screens/OnboardingScreen';
import BudgetSetupScreen from './screens/BudgetSetupScreen';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ReportScreen from './screens/ReportScreen';
import HistoricScreen from './screens/HistoricScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  BudgetSetup: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Home: undefined;
  Camera: undefined;
  Report: undefined;
  Historic: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C66FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingBottom: 24,
          paddingTop: 12,
          height: 80,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Historic') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ tabBarLabel: 'Scan' }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen}
        options={{ tabBarLabel: 'Report' }}
      />
      <Tab.Screen 
        name="Historic" 
        component={HistoricScreen}
        options={{ tabBarLabel: 'Month' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const profileData = await AsyncStorage.getItem('@moneymirror_user_profile');
        if (profileData) {
          const profile = JSON.parse(profileData);
          if (profile.setupComplete) {
            setInitialRoute('MainTabs');
            return;
          }
        }
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          setInitialRoute('BudgetSetup');
          return;
        }
        setInitialRoute('Onboarding');
      } catch {
        setInitialRoute('Onboarding');
      }
    };
    checkSetup();
  }, []);

  if (!initialRoute) return null; // Loading

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
