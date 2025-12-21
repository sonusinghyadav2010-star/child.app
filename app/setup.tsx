
import { View, Text, Button, BackHandler } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSharedPreferences } from '../hooks/useSharedPreferences';

const SetupScreen = () => {
  const router = useRouter();
  const { setItem } = useSharedPreferences();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );
    return () => backHandler.remove();
  }, []);

  const handleCompleteSetup = async () => {
    await setItem('permissionsSetupComplete', 'true');
    router.replace('/dashboard');
  };

  return (
    <View>
      <Text>Setup Screen</Text>
      <Button title="Complete Setup" onPress={handleCompleteSetup} />
    </View>
  );
};

export default SetupScreen;
