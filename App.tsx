import React from 'react';
import { useFonts } from '@expo-google-fonts/poppins';
import { Poppins_400Regular, Poppins_900Black } from '@expo-google-fonts/poppins';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreateTaskScreen } from './src/screens/CreateTaskScreen';
import { SplashScreen } from './src/screens/SplashScreen';

export default function App() {
  const [screen, setScreen] = React.useState<'splash' | 'home' | 'create'>('splash');
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_900Black,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setScreen('home'), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (screen === 'splash') {
    return <SplashScreen />;
  }

  if (screen === 'create') {
    return (
      <CreateTaskScreen
        onCancel={() => setScreen('home')}
        onCreated={() => setScreen('home')}
      />
    );
  }

  return <HomeScreen onPressCreate={() => setScreen('create')} />;
}
