import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    title: string;
    value: number;
    icon: string;
    accentColor: string;
    bgColor: string;
}

export default function StatCard({ title, value, icon, accentColor, bgColor }: Props) {
    return (
        <View style={[styles.card, { borderLeftColor: accentColor }]}>
            <View style={[styles.iconBg, { backgroundColor: bgColor }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        minWidth: 0,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    icon: {
        fontSize: 20,
    },
    value: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
});
