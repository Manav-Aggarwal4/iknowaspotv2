import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './MapScreen';


if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = require('node-fetch').ReadableStream;
}
const Stack = createNativeStackNavigator();

export default function App() { return ( 
<NavigationContainer> 
  <Stack.Navigator 
  initialRouteName="Map"> 
  <Stack.Screen name="Map" component={MapScreen} /> 
  </Stack.Navigator> 
  </NavigationContainer> ); 
  }

