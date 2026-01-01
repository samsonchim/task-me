import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type AlarmOverlayProps = {
  visible: boolean;
  title: string;
  onStop: () => void;
};

export function AlarmOverlay({ visible, title, onStop }: AlarmOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.heading}>Task Me Alarm</Text>
          <Text style={styles.title}>{title}</Text>

          <TouchableOpacity accessibilityRole="button" onPress={onStop} style={styles.stopBtn}>
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: '#000000',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    marginBottom: 10,
  },
  title: {
    color: '#BDBDBD',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 18,
  },
  stopBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_900Black',
  },
});
