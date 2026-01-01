import React from 'react';
import { useFonts } from '@expo-google-fonts/poppins';
import { Poppins_400Regular, Poppins_900Black } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreateTaskScreen } from './src/screens/CreateTaskScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { AlarmOverlay } from './src/ui/AlarmOverlay';
import { configureNotificationsAsync } from './src/lib/alarms';

export default function App() {
  const [screen, setScreen] = React.useState<'splash' | 'home' | 'create'>('splash');
  const [activeAlarmTitle, setActiveAlarmTitle] = React.useState<string | null>(null);
  const alarmPlayerRef = React.useRef<AudioPlayer | null>(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_900Black,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setScreen('home'), 1400);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Configure once at app start.
    void configureNotificationsAsync();

    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      const title = (notification.request.content.data as any)?.title;
      const body = notification.request.content.body;
      setActiveAlarmTitle(typeof title === 'string' ? `Time for ${title}` : body ?? 'Time for your task');
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const title = (response.notification.request.content.data as any)?.title;
      const body = response.notification.request.content.body;
      setActiveAlarmTitle(typeof title === 'string' ? `Time for ${title}` : body ?? 'Time for your task');
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function stopAndUnload() {
      const existing = alarmPlayerRef.current;
      alarmPlayerRef.current = null;
      if (existing) {
        try {
          existing.pause();
        } catch {}
        try {
          existing.remove();
        } catch {}
      }
    }

    async function start() {
      await stopAndUnload();
      if (!activeAlarmTitle) return;

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });

        const player = createAudioPlayer(require('./assets/alarm.mp3'));
        player.loop = true;
        player.volume = 1.0;
        player.play();

        if (cancelled) {
          try {
            player.pause();
          } catch {}
          try {
            player.remove();
          } catch {}
          return;
        }

        alarmPlayerRef.current = player;
      } catch {
        // If audio fails, still show overlay.
      }
    }

    void start();

    return () => {
      cancelled = true;
      void stopAndUnload();
    };
  }, [activeAlarmTitle]);

  async function onStopAlarm() {
    setActiveAlarmTitle(null);
    const existing = alarmPlayerRef.current;
    alarmPlayerRef.current = null;
    if (existing) {
      try {
        existing.pause();
      } catch {}
      try {
        existing.remove();
      } catch {}
    }
  }

  if (!fontsLoaded) {
    return null;
  }

  if (screen === 'splash') {
    return <SplashScreen />;
  }

  if (screen === 'create') {
    return (
      <>
        <CreateTaskScreen onCancel={() => setScreen('home')} onCreated={() => setScreen('home')} />
        <AlarmOverlay visible={!!activeAlarmTitle} title={activeAlarmTitle ?? ''} onStop={onStopAlarm} />
      </>
    );
  }

  return (
    <>
      <HomeScreen onPressCreate={() => setScreen('create')} />
      <AlarmOverlay visible={!!activeAlarmTitle} title={activeAlarmTitle ?? ''} onStop={onStopAlarm} />
    </>
  );
}
