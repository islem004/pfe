import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { StatusCount } from '../types/statistics';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
    pending:    '#F59E0B',
    confirmed:  '#3B82F6',
    picked_up:  '#3B82F6',
    in_transit: '#6366F1',
    delivered:  '#22C55E',
    failed:     '#EF4444',
    cancelled:  '#9CA3AF',
    problem:    '#9333EA',
};

const STATUS_LABELS: Record<string, string> = {
    pending:    'Pending',
    confirmed:  'Confirmed',
    picked_up:  'Picked Up',
    in_transit: 'In Transit',
    delivered:  'Delivered',
    failed:     'Failed',
    cancelled:  'Cancelled',
    problem:    'Problem',
};

interface Props {
    data: StatusCount[];
}

export default function StatusPieChart({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No data available</Text>
            </View>
        );
    }

    const chartData = data.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        population: item.count,
        color: STATUS_COLORS[item.status] || '#9CA3AF',
        legendFontColor: '#6B7280',
        legendFontSize: 12,
    }));

    return (
        <View>
            <PieChart
                data={chartData}
                width={width - 32}
                height={200}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
            />
            {/* Custom legend with percentage */}
            <View style={styles.legend}>
                {data.map(item => (
                    <View key={item.status} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF' }]} />
                        <Text style={styles.legendLabel}>{STATUS_LABELS[item.status] || item.status}</Text>
                        <Text style={styles.legendCount}>{item.count}</Text>
                        <Text style={styles.legendPct}>{item.percentage}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    empty: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    legend: {
        marginTop: 8,
        paddingHorizontal: 8,
        gap: 8,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLabel: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    legendCount: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '700',
        minWidth: 28,
        textAlign: 'right',
    },
    legendPct: {
        fontSize: 12,
        color: '#9ca3af',
        minWidth: 36,
        textAlign: 'right',
    },
});
