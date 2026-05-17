import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ActivityPoint } from '../types/statistics';

const { width } = Dimensions.get('window');

interface Props {
    data: ActivityPoint[];
}

export default function ActivityChart({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No activity data</Text>
            </View>
        );
    }

    const labels = data.map(d => d.label);
    const values = data.map(d => d.count);
    const hasAnyActivity = values.some(v => v > 0);

    return (
        <View>
            <LineChart
                data={{
                    labels,
                    datasets: [{ data: hasAnyActivity ? values : values.map(() => 0) }],
                }}
                width={width - 32}
                height={180}
                yAxisInterval={1}
                chartConfig={{
                    backgroundColor: '#2563eb',
                    backgroundGradientFrom: '#1d4ed8',
                    backgroundGradientTo: '#3b82f6',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#ffffff',
                    },
                    propsForBackgroundLines: {
                        stroke: 'rgba(255,255,255,0.15)',
                    },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
            />
            {!hasAnyActivity && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>No deliveries completed this week</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    chart: {
        borderRadius: 16,
    },
    empty: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    },
    overlayText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
});
