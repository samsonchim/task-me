import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export type AlarmTask = {
  id: string;
  title: string;
  category: string;
  start_time: string | null;
  reminder_every_mins?: number | null;
};

const STORAGE_KEY = 'taskme.scheduledAlarms.v1';
// NOTE: Android notification channel sound cannot be changed once created.
// If you change sound/vibration settings, bump this ID and reinstall the app.
const ANDROID_CHANNEL_ID = 'task-alarms-v2';

function tryConfigureNotificationHandler() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Some platforms (e.g. web) may not fully support notification handlers.
  }
}

function parseStartTimeToToday(startTime: string | null, now: Date) {
  if (!startTime) return null;
  const raw = startTime.trim();

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

function getNextTriggerDate(task: AlarmTask, now: Date) {
  const startToday = parseStartTimeToToday(task.start_time, now);
  if (!startToday) return null;

  const category = (task.category ?? '').toLowerCase();
  const isReminder = category.includes('reminder');
  const isRoutine = category.includes('routine');
  const isOneTime = category.includes('one');

  if (isReminder) {
    // Reminder scheduling is handled separately.
    return null;
  }

  if (now < startToday) return startToday;

  // already passed today
  if (isRoutine && !isOneTime) {
    const next = new Date(startToday);
    next.setDate(next.getDate() + 1);
    return next;
  }

  // one-time already passed: nothing to schedule
  return null;
}

function getReminderOccurrences(task: AlarmTask, now: Date) {
  const start = parseStartTimeToToday(task.start_time, now);
  const everyMins = task.reminder_every_mins ?? null;
  if (!start || !everyMins || everyMins <= 0) return [];

  const intervalMs = everyMins * 60 * 1000;
  // Schedule ahead, but cap occurrences to avoid OS limits (iOS is especially strict).
  const horizonMs = 7 * 24 * 60 * 60 * 1000;
  const maxOccurrences = Math.min(60, Math.ceil(horizonMs / intervalMs));
  const until = now.getTime() + horizonMs;

  let next = start;
  if (next.getTime() <= now.getTime()) {
    const elapsed = now.getTime() - start.getTime();
    const k = Math.ceil(elapsed / intervalMs);
    next = new Date(start.getTime() + k * intervalMs);
  }

  const out: Date[] = [];
  for (let i = 0; i < maxOccurrences; i++) {
    const t = next.getTime() + i * intervalMs;
    if (t > until) break;
    out.push(new Date(t));
  }
  return out;
}

async function ensurePermissionsAsync() {
  // iOS simulator + some Android emulators can behave differently
  if (!Device.isDevice && Platform.OS !== 'web') {
    // Still allow scheduling local notifications in dev; just request permissions.
  }

  const perms = await Notifications.getPermissionsAsync();
  if (perms.granted) return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function configureNotificationsAsync() {
  if (Platform.OS === 'web') return;

  tryConfigureNotificationHandler();
  await ensurePermissionsAsync();

  if (Platform.OS === 'android') {
    // Channel sound name must match the resource name in res/raw (no extension).
    // The expo-notifications config plugin copies ./assets/alarm.mp3 into res/raw.
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Task Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'alarm',
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

type ScheduledMap = Record<string, { notificationId: string; triggerAt: number }>;

async function loadScheduledMap(): Promise<ScheduledMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ScheduledMap;
  } catch {
    return {};
  }
}

async function saveScheduledMap(map: ScheduledMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function makeKey(taskId: string, trigger: Date) {
  // uniqueness per task + exact trigger time
  return `${taskId}:${trigger.getFullYear()}-${trigger.getMonth() + 1}-${trigger.getDate()} ${trigger.getHours()}:${trigger.getMinutes()}`;
}

export async function cancelScheduledAlarmsForTaskAsync(taskId: string) {
  const scheduled = await loadScheduledMap();
  const keys = Object.keys(scheduled).filter((k) => k.startsWith(`${taskId}:`));
  if (keys.length === 0) return;

  for (const key of keys) {
    const id = scheduled[key]?.notificationId;
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {}
    }
    delete scheduled[key];
  }

  await saveScheduledMap(scheduled);
}

export async function scheduleAlarmsForTasksAsync(tasks: AlarmTask[]) {
  const hasPerm = await ensurePermissionsAsync();
  if (!hasPerm) return;

  await configureNotificationsAsync();

  const now = new Date();
  const scheduled = await loadScheduledMap();

  // prune old entries (keep a bit more than the scheduling horizon)
  const cutoff = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  for (const key of Object.keys(scheduled)) {
    if (scheduled[key].triggerAt < cutoff) {
      delete scheduled[key];
    }
  }

  for (const task of tasks) {
    const category = (task.category ?? '').toLowerCase();
    const isReminder = category.includes('reminder');

    if (isReminder) {
      const dates = getReminderOccurrences(task, now);
      for (const triggerDate of dates) {
        if (triggerDate.getTime() <= now.getTime() + 1000) continue;
        const key = makeKey(task.id, triggerDate);
        if (scheduled[key]) continue;

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Me',
            body: `Reminder: ${task.title}`,
            data: { taskId: task.id, title: task.title },
            ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null),
            ...(Platform.OS === 'ios' ? { sound: 'alarm.mp3' as const } : null),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        scheduled[key] = { notificationId, triggerAt: triggerDate.getTime() };
      }
      continue;
    }

    const triggerDate = getNextTriggerDate(task, now);
    if (!triggerDate) continue;

    // skip if somehow in the past
    if (triggerDate.getTime() <= now.getTime() + 1000) continue;

    const key = makeKey(task.id, triggerDate);
    if (scheduled[key]) continue;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Me',
        body: `Focus: ${task.title}`,
        data: { taskId: task.id, title: task.title },
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null),
        ...(Platform.OS === 'ios' ? { sound: 'alarm.mp3' as const } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    scheduled[key] = { notificationId, triggerAt: triggerDate.getTime() };
  }

  await saveScheduledMap(scheduled);
}
