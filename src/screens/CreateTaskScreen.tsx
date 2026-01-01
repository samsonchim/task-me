import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

export type CreateTaskPayload = {
  title: string;
  duration: string;
  importance: 'Not too important' | 'Mid' | 'Very Important' | 'Extremely important';
  category: 'Routine' | 'One-time';
  startTime: string;
};

type CreateTaskScreenProps = {
  onCreated: () => void;
  onCancel: () => void;
};

const IMPORTANCE_OPTIONS: CreateTaskPayload['importance'][] = [
  'Not too important',
  'Mid',
  'Very Important',
  'Extremely important',
];

const CATEGORY_OPTIONS: CreateTaskPayload['category'][] = ['Routine', 'One-time'];

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            accessibilityRole="button"
            onPress={() => onChange(opt)}
            style={[styles.segmentBtn, active ? styles.segmentBtnActive : null]}
          >
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function CreateTaskScreen({ onCreated, onCancel }: CreateTaskScreenProps) {
  const [title, setTitle] = React.useState('');
  const [durationHours, setDurationHours] = React.useState(0);
  const [durationMinutes, setDurationMinutes] = React.useState(0);
  const [durationSeconds, setDurationSeconds] = React.useState(0);
  const [importance, setImportance] = React.useState<CreateTaskPayload['importance']>('Mid');
  const [category, setCategory] = React.useState<CreateTaskPayload['category']>('Routine');
  const [startTime, setStartTime] = React.useState('');
  const [startTimeDate, setStartTimeDate] = React.useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pickerItemColor = Platform.OS === 'android' ? '#000000' : '#FFFFFF';

  const durationLabel = React.useMemo(() => {
    const h = durationHours;
    const m = durationMinutes;
    const s = durationSeconds;
    return `${h}h ${m}m ${s}s`;
  }, [durationHours, durationMinutes, durationSeconds]);

  const startTimeLabel = React.useMemo(() => {
    if (!startTimeDate) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(startTimeDate);
  }, [startTimeDate]);

  function onPickTime(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && selected) {
      setStartTimeDate(selected);
      setStartTime(
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(selected)
      );
    }
  }

  async function onSave() {
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required.');
      return;
    }

    if (durationHours === 0 && durationMinutes === 0 && durationSeconds === 0) {
      setError('Duration is required.');
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        title: trimmedTitle,
        duration: durationLabel,
        importance,
        category,
        start_time: startTime.trim(),
      });

      if (insertError) {
        throw insertError;
      }

      onCreated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Task</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onCancel}>
          <Text style={styles.headerAction}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Study CSC 301"
            placeholderTextColor="#8E8E8E"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationCol}>
              <Text style={styles.durationLabel}>Hours</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={durationHours}
                  onValueChange={(v) => setDurationHours(Number(v))}
                  dropdownIconColor="#FFFFFF"
                  style={styles.picker}
                >
                  {Array.from({ length: 13 }).map((_, i) => (
                    <Picker.Item key={i} label={`${i}`} value={i} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.durationCol}>
              <Text style={styles.durationLabel}>Minutes</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={durationMinutes}
                  onValueChange={(v) => setDurationMinutes(Number(v))}
                  dropdownIconColor="#FFFFFF"
                  style={styles.picker}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <Picker.Item key={i} label={`${i}`} value={i} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.durationCol}>
              <Text style={styles.durationLabel}>Seconds</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={durationSeconds}
                  onValueChange={(v) => setDurationSeconds(Number(v))}
                  dropdownIconColor="#FFFFFF"
                  style={styles.picker}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <Picker.Item key={i} label={`${i}`} value={i} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <Text style={styles.durationPreview}>{durationLabel}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Importance</Text>
          <Segmented value={importance} options={IMPORTANCE_OPTIONS} onChange={setImportance} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <Segmented value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Start Time</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowTimePicker(true)}
            style={styles.input}
            activeOpacity={0.8}
          >
            <Text style={[styles.timeValue, !startTimeLabel ? styles.timePlaceholder : null]}>
              {startTimeLabel || 'Select time'}
            </Text>
          </TouchableOpacity>

          {showTimePicker ? (
            <DateTimePicker
              value={startTimeDate ?? new Date()}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onPickTime}
            />
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onSave}
          disabled={saving}
          style={[styles.saveBtn, saving ? styles.saveBtnDisabled : null]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Create Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
  },
  headerAction: {
    color: '#D32F2F',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#BDBDBD',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationCol: {
    flex: 1,
  },
  durationLabel: {
    color: '#BDBDBD',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 6,
  },
  pickerWrap: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  picker: {
    color: '#FFFFFF',
  },
  durationPreview: {
    marginTop: 10,
    color: '#D0D0D0',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  timeValue: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  timePlaceholder: {
    color: '#8E8E8E',
  },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  segmentBtnActive: {
    borderColor: 'rgba(211,47,47,0.9)',
    backgroundColor: 'rgba(211,47,47,0.18)',
  },
  segmentText: {
    color: '#D0D0D0',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_900Black',
  },
});
