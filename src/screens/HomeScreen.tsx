import React from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProgressRing } from '../ui/ProgressRing';

type Task = {
  id: string;
  title: string;
  duration: string;
  importance: string;
  category: string;
  started: string;
  progress: number; // 0..1
};

const tasks: Task[] = [
  {
    id: '1',
    title: 'Study CSC 301',
    duration: '2hrs',
    importance: 'Extreme',
    category: 'Routine',
    started: '7:00am (1hr 30mins ago)',
    progress: 0.75,
  },
  {
    id: '2',
    title: 'Edit Landing Page on Yielddx',
    duration: '2hrs',
    importance: 'Skip-able',
    category: 'Routine',
    started: '8:40am (1hr 30mins later)',
    progress: 0,
  },
];

function formatGreetingDate(date: Date) {
  const hour = date.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(date);

  return `${greeting}, ${weekday} ${month} ${day}, ${year}`;
}

function TaskCard({ task }: { task: Task }) {
  const percentLabel = `${Math.round(task.progress * 100)}%`;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{task.title}</Text>

        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Duration: </Text>
          <Text style={styles.metaValueRed}>{task.duration}</Text>
        </Text>

        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Importance: </Text>
          <Text style={styles.metaValueRed}>{task.importance}</Text>
        </Text>

        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Category: </Text>
          <Text style={styles.metaValue}>{task.category}</Text>
        </Text>

        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Started: </Text>
          <Text style={styles.metaValueRed}>{task.started}</Text>
        </Text>
      </View>

      <View style={styles.cardRight}>
        <ProgressRing
          size={76}
          strokeWidth={10}
          progress={task.progress}
          trackColor="#D0D0D0"
          progressColor="#D32F2F"
          label={percentLabel}
        />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const subtitle = React.useMemo(() => formatGreetingDate(new Date()), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Open Tasks (9)</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.headerMenu} accessibilityRole="button">
          <Ionicons name="menu" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnActive]} accessibilityRole="button">
            <Image source={require('../../assets/open.png')} style={styles.bottomIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnCenter]} accessibilityRole="button">
            <Image
              source={require('../../assets/creaate.png')}
              style={[styles.bottomIcon, styles.bottomIconCenter]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBtn} accessibilityRole="button">
            <Image
              source={require('../../assets/complete.png')}
              style={styles.bottomIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0) + 18,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    textAlign: 'left',
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#BDBDBD',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  headerMenu: {
    width: 34,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  card: {
    backgroundColor: '#303030',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  cardRight: {
    width: 86,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
    marginBottom: 8,
  },
  metaLine: {
    color: '#CFCFCF',
    fontSize: 12,
    marginBottom: 3,
    fontFamily: 'Poppins_400Regular',
  },
  metaLabel: {
    color: '#BDBDBD',
    fontFamily: 'Poppins_400Regular',
  },
  metaValue: {
    color: '#CFCFCF',
    fontFamily: 'Poppins_400Regular',
  },
  metaValueRed: {
    color: '#D32F2F',
    fontFamily: 'Poppins_400Regular',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingBottom: 22,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.0)',
  },
  bottomBarInner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  bottomBtnCenter: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomIcon: {
    width: 24,
    height: 24,
  },
  bottomIconCenter: {
    width: 26,
    height: 26,
  },
});
