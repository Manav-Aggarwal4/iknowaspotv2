import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import MapScreen from './screens/MapScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import FriendsScreen from './screens/FriendsScreen';

const Stack = createNativeStackNavigator();

function CustomTabNavigator() {
  const [activeTab, setActiveTab] = useState('MapTab');

  const renderScreen = () => {
    switch (activeTab) {
      case 'MapTab':
        return <MapScreen />;
      case 'Favorites':
        return <FavoritesScreen />;
      case 'Friends':
        return <FriendsScreen />;
      default:
        return <MapScreen />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('MapTab')}
        >
          <Ionicons 
            name={activeTab === 'MapTab' ? 'map' : 'map-outline'} 
            size={24} 
            color={activeTab === 'MapTab' ? '#006400' : 'gray'} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('Favorites')}
        >
          <Ionicons 
            name={activeTab === 'Favorites' ? 'heart' : 'heart-outline'} 
            size={24} 
            color={activeTab === 'Favorites' ? '#006400' : 'gray'} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('Friends')}
        >
          <Ionicons 
            name={activeTab === 'Friends' ? 'people' : 'people-outline'} 
            size={24} 
            color={activeTab === 'Friends' ? '#006400' : 'gray'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFACD',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Map" 
          component={CustomTabNavigator} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}