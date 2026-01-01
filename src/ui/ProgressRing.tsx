import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Rect } from 'react-native-svg';

type ProgressRingProps = {
  size: number;
  strokeWidth: number;
  progress: number; // 0..1
  trackColor: string;
  progressColor: string;
  label: string;
};

export function ProgressRing({
  size,
  strokeWidth: _strokeWidth,
  progress,
  trackColor,
  progressColor,
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = size / 2;
  const fillHeight = size * clamped;
  const fillY = size - fillHeight;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <ClipPath id="clipCircle">
              <Circle cx={radius} cy={radius} r={radius} />
            </ClipPath>
          </Defs>

          <Circle cx={radius} cy={radius} r={radius} fill={trackColor} />
          {clamped > 0 ? (
            <Rect
              x={0}
              y={fillY}
              width={size}
              height={fillHeight}
              fill={progressColor}
              clipPath="url(#clipCircle)"
            />
          ) : null}
        </Svg>

        <View style={styles.textContainer}>
          <Text style={styles.percentText}>{label}</Text>
        </View>
      </View>

      <Text style={styles.subText}>Completed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    color: '#000000',
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
  },
  subText: {
    marginTop: 4,
    color: '#BDBDBD',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
});
