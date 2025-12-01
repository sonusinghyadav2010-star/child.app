
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import ScanQRScreen from './src/screens/ScanQRScreen';
import PermissionSetupScreen from './src/screens/PermissionSetupScreen';
import MonitoringScreen from './src/screens/MonitoringScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ScanQR" component={ScanQRScreen} />
        <Stack.Screen name="PermissionSetup" component={PermissionSetupScreen} />
        <Stack.Screen name="Monitoring" component={MonitoringScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
