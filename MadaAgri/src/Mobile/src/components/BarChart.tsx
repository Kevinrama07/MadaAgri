import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  barWidth?: number;
  barRadius?: number;
  color?: string;
  showValues?: boolean;
  labelSize?: number;
  maxValue?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BarChart({
  data,
  height = 160,
  barWidth = 24,
  barRadius = 6,
  color = '#4CAF50',
  showValues = true,
  labelSize = 10,
  maxValue,
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 8);
          return (
            <View key={index} style={styles.barColumn}>
              {showValues && item.value > 0 && (
                <Text style={[styles.value, { fontSize: labelSize }]}>
                  {item.value >= 1000 ? (item.value / 1000).toFixed(1) + 'k' : item.value}
                </Text>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 2),
                    width: barWidth,
                    borderRadius: barRadius,
                    backgroundColor: item.color || color,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {data.map((item, index) => (
          <Text
            key={index}
            style={[styles.label, { fontSize: labelSize, width: barWidth + 8 }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    minHeight: 2,
  },
  value: {
    fontWeight: '600',
    color: '#666',
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  label: {
    textAlign: 'center',
    color: '#999',
  },
});
