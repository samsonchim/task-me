import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type SplashScreenProps = {
  title?: string;
};

export function SplashScreen({ title = 'Task Me.' }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.logoOuter}>
        <View style={styles.logoInner}>
          <Image
            source={require('../../assets/taskme.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7D3533',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 74,
    height: 74,
  },
  title: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 0.2,
  },
});
