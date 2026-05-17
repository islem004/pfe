import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusPieChart from '../../components/StatusPieChart';
import ActivityChart from '../../components/ActivityChart';
import { StaffStatistics } from '../../types/statistics';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    confirmed:  { bg: '#dbeafe', text: '#1e40af', label: 'Confirmed' },
    picked_up:  { bg: '#ede9fe', text: '#5b21b6', label: 'Picked Up' },
    in_transit: { bg: '#d1fae5', text: '#065f46', label: 'In Transit' },
    delivered:  { bg: '#dcfce7', text: '#14532d', label: 'Delivered' },
    failed:     { bg: '#fee2e2', text: '#991b1b', label: 'Failed' },
    cancelled:  { bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
    problem:    { bg: '#f3e8ff', text: '#6b21a8', label: 'Problem' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function StatisticsScreen() {
    const [stats, setStats] = useState<StaffStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setError(null);
            const response = await api.get('/staff/statistics');
            setStats(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load statistics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading statistics…</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Could not load statistics</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchStats(); }}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (stats?.total === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={{ fontSize: 48 }}>📦</Text>
                <Text style={styles.errorTitle}>No deliveries yet</Text>
                <Text style={styles.errorMessage}>Your statistics will appear here once deliveries are assigned to you.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Statistics</Text>
                    <Text style={styles.headerSubtitle}>Your delivery performance</Text>
                </View>

                {/* Summary Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.cardsRow}>
                        <StatCard
                            title="Total"
                            value={stats!.total}
                            icon="📦"
                            accentColor="#2563eb"
                            bgColor="#eff6ff"
                        />
                        <StatCard
                            title="Delivered"
                            value={stats!.delivered}
                            icon="✅"
                            accentColor="#22c55e"
                            bgColor="#f0fdf4"
                        />
                    </View>
                    <View style={styles.cardsRow}>
                        <StatCard
                            title="In Transit"
                            value={stats!.in_transit}
                            icon="🚚"
                            accentColor="#6366f1"
                            bgColor="#eef2ff"
                        />
                        <StatCard
                            title="Pending"
                            value={stats!.pending}
                            icon="⏳"
                            accentColor="#f59e0b"
                            bgColor="#fffbeb"
                        />
                    </View>
                    <View style={styles.cardsRow}>
                        <StatCard
                            title="Picked Up"
                            value={stats!.picked_up}
                            icon="🤝"
                            accentColor="#3b82f6"
                            bgColor="#eff6ff"
                        />
                        <StatCard
                            title="Failed"
                            value={stats!.failed}
                            icon="❌"
                            accentColor="#ef4444"
                            bgColor="#fef2f2"
                        />
                    </View>
                </View>

                {/* Success Rate */}
                {stats!.total > 0 && (
                    <View style={styles.section}>
                        <View style={styles.successRateCard}>
                            <View>
                                <Text style={styles.successRateLabel}>Success Rate</Text>
                                <Text style={styles.successRateValue}>
                                    {Math.round((stats!.delivered / stats!.total) * 100)}%
                                </Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${Math.round((stats!.delivered / stats!.total) * 100)}%` as any },
                                    ]}
                                />
                            </View>
                            <Text style={styles.successRateSub}>
                                {stats!.delivered} delivered out of {stats!.total} assigned
                            </Text>
                        </View>
                    </View>
                )}

                {/* Status Distribution */}
                {stats!.status_distribution.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Status Distribution</Text>
                        <View style={styles.card}>
                            <StatusPieChart data={stats!.status_distribution} />
                        </View>
                    </View>
                )}

                {/* Weekly Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <Text style={styles.sectionSub}>Deliveries completed per day (last 7 days)</Text>
                    <View style={styles.card}>
                        <ActivityChart data={stats!.weekly_activity} />
                    </View>
                </View>

                {/* Recent Deliveries */}
                {stats!.recent_deliveries.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                        <View style={styles.card}>
                            {stats!.recent_deliveries.map((delivery, index) => {
                                const statusStyle = STATUS_COLORS[delivery.status] || STATUS_COLORS.pending;
                                return (
                                    <TouchableOpacity
                                        key={delivery.id}
                                        style={[
                                            styles.recentRow,
                                            index < stats!.recent_deliveries.length - 1 && styles.recentRowBorder,
                                        ]}
                                        onPress={() => router.push(`/delivery/${delivery.id}` as any)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.recentLeft}>
                                            <Text style={styles.recentNumber}>{delivery.delivery_number}</Text>
                                            <Text style={styles.recentCity}>
                                                {delivery.dest_city || delivery.delivery_address_text || '—'}
                                            </Text>
                                        </View>
                                        <View style={styles.recentRight}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                                <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                                                    {statusStyle.label}
                                                </Text>
                                            </View>
                                            <Text style={styles.recentDate}>{timeAgo(delivery.created_at)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fb',
        padding: 24,
    },
    scroll: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 8,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    sectionSub: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: -6,
        marginBottom: 10,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    successRateCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        gap: 12,
    },
    successRateLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    successRateValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#22c55e',
        letterSpacing: -1,
        marginTop: 2,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 8,
    },
    successRateSub: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    recentRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    recentLeft: {
        flex: 1,
        marginRight: 12,
    },
    recentNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    recentCity: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    recentRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    recentDate: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '500',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    retryBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 15,
    },
});
