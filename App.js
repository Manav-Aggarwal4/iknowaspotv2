import React from 'react'; 
import { NavigationContainer } from '@react-navigation/native'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './MapScreen'; 
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator(); 

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error:', error);
    console.log('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong!</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() { 
    return (
        <ErrorBoundary>
            <NavigationContainer> 
                <Stack.Navigator initialRouteName="Map">
                    <Stack.Screen name="Map" component={MapScreen} /> 
                </Stack.Navigator> 
            </NavigationContainer> 
        </ErrorBoundary>
    );
}