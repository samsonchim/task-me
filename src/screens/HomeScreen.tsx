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
import { supabase } from '../lib/supabase';

type TaskRow = {
  id: string;
  title: string;
  duration: string | null;
  importance: string;
  category: string;
  start_time: string | null;
  created_at: string;
};

type TaskVM = {
  id: string;
  title: string;
  duration: string;
  importance: string;
  category: string;
  started: string;
  progress: number; // 0..1
  sortKey: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function parseDurationMs(duration: string | null) {
  if (!duration) return 0;

  const normalized = duration.trim();
  // supports "2h 30m 10s"
  const h = normalized.match(/(\d+)\s*h/i);
  const m = normalized.match(/(\d+)\s*m/i);
  const s = normalized.match(/(\d+)\s*s/i);
  const hours = h ? Number(h[1]) : 0;
  const minutes = m ? Number(m[1]) : 0;
  const seconds = s ? Number(s[1]) : 0;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function parseStartTimeToToday(startTime: string | null, now: Date) {
  if (!startTime) return null;
  const raw = startTime.trim();

  // Accept "7:00 AM", "7:00am", "07:00", "7:00"
  const ampm = raw.match(/\b(am|pm)\b/i);
  const timePart = raw.replace(/\s*(am|pm)\s*/i, '').trim();
  const parts = timePart.split(':');
  if (parts.length < 1) return null;

  const hourRaw = Number(parts[0]);
  const minuteRaw = parts.length >= 2 ? Number(parts[1]) : 0;
  if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) return null;

  let hour = hourRaw;
  const minute = minuteRaw;

  if (ampm) {
    const meridiem = ampm[1].toLowerCase();
    if (meridiem === 'am') {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
  }

  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatRelative(from: Date, to: Date) {
  const diffMs = to.getTime() - from.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);

  if (mins < 1) return diffMs >= 0 ? 'just now' : 'in a moment';
  if (mins < 60) return diffMs >= 0 ? `${mins}mins ago` : `in ${mins}mins`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    return diffMs >= 0 ? `${hours}hr ${rem}mins ago` : `in ${hours}hr ${rem}mins`;
  }

  const days = Math.floor(hours / 24);
  return diffMs >= 0 ? `${days}d ago` : `in ${days}d`;
}

function formatGreetingDate(date: Date) {
  const hour = date.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(date);

  return `${greeting}, ${weekday} ${month} ${day}, ${year}`;
}

function TaskCard({ task }: { task: TaskVM }) {
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

export type HomeScreenProps = {
  onPressCreate: () => void;
};

export function HomeScreen({ onPressCreate }: HomeScreenProps) {
  const subtitle = React.useMemo(() => formatGreetingDate(new Date()), []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [tick, setTick] = React.useState(0);

  const fetchTasks = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from('tasks')
        .select('id,title,duration,importance,category,start_time,created_at');

      if (qErr) throw qErr;
      setRows((data ?? []) as TaskRow[]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const tasks = React.useMemo<TaskVM[]>(() => {
    // re-compute every tick
    void tick;
    const now = new Date();
    const list: TaskVM[] = [];

    for (const row of rows) {
      const durationMs = parseDurationMs(row.duration);
      const startToday = parseStartTimeToToday(row.start_time, now);
      if (!startToday || durationMs <= 0) {
        // keep visible but 0% if incomplete data
        list.push({
          id: row.id,
          title: row.title,
          duration: row.duration ?? '',
          importance: row.importance,
          category: row.category,
          started: row.start_time ? `${row.start_time}` : '—',
          progress: 0,
          sortKey: Number.POSITIVE_INFINITY,
        });
        continue;
      }

      const endToday = new Date(startToday.getTime() + durationMs);
      const isRoutine = row.category.toLowerCase().includes('routine');
      const isOneTime = row.category.toLowerCase().includes('one');

      let progress = 0;
      let sortTime = startToday;
      let startedLabel = `${formatTimeLabel(startToday)} (${formatRelative(startToday, now)})`;

      if (now < startToday) {
        progress = 0;
      } else if (now >= startToday && now <= endToday) {
        progress = clamp01((now.getTime() - startToday.getTime()) / durationMs);
      } else {
        // past end
        if (isOneTime && !isRoutine) {
          // one-time completed: do not appear in open list
          continue;
        }

        // routine: reset for next day
        progress = 0;
        const next = new Date(startToday);
        next.setDate(next.getDate() + 1);
        sortTime = next;
        startedLabel = `${formatTimeLabel(next)} (tomorrow)`;
      }

      const sortKey = Math.abs(sortTime.getTime() - now.getTime());
      list.push({
        id: row.id,
        title: row.title,
        duration: row.duration ?? '',
        importance: row.importance,
        category: row.category,
        started: startedLabel,
        progress,
        sortKey,
      });
    }

    list.sort((a, b) => a.sortKey - b.sortKey);
    return list;
  }, [rows, tick]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Open Tasks ({tasks.length})</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
          {error ? <Text style={styles.headerError}>{error}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.headerMenu}
          accessibilityRole="button"
          onPress={fetchTasks}
          disabled={loading}
        >
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
          <TouchableOpacity
            style={[styles.bottomBtn, styles.bottomBtnCenter]}
            accessibilityRole="button"
            onPress={onPressCreate}
          >
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
  headerError: {
    marginTop: 6,
    color: '#D32F2F',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
