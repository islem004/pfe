import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUnlockedIds } from '../../utils/unlockedDeliveries';
import api from '../../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    created:    { bg: '#ffedd5', text: '#9a3412', label: 'Created' },
    confirmed:  { bg: '#ede9fe', text: '#5b21b6', label: 'Confirmed' },
    picked_up:  { bg: '#dbeafe', text: '#1e40af', label: 'Picked Up' },
    shipped:    { bg: '#f5f3ff', text: '#4c1d95', label: 'Shipped' },
    delivered:  { bg: '#dcfce7', text: '#14532d', label: 'Delivered' },
    failed:     { bg: '#fee2e2', text: '#991b1b', label: 'Failed' },
    cancelled:  { bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
};

const PRIORITY_COLORS: Record<string, string> = {
    low: '#9ca3af',
    normal: '#2563eb',
    high: '#f59e0b',
    urgent: '#ef4444',
};

export default function DeliveriesScreen() {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
    const [myRank, setMyRank] = useState<number | null>(null);
    const [myCompleted, setMyCompleted] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadUnlocked = async () => {
        if (user?.id) {
            const ids = await getUnlockedIds(user.id);
            setUnlockedIds(ids);
        }
    };

    const fetchDeliveries = async () => {
        try {
            const [response, rankResp] = await Promise.all([
                api.get('/staff/deliveries'),
                api.get('/staff/my-rank').catch(() => null),
                loadUnlocked(),
            ]);
            setDeliveries(response.data);
            if (rankResp?.data) {
                setMyRank(rankResp.data.rank);
                setMyCompleted(rankResp.data.completed ?? 0);
            }
        } catch (error: any) {
            console.log('Failed to fetch deliveries:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDeliveries();
    }, []);

    const isUnlocked = (id: number, status: string) =>
        unlockedIds.has(id) || ['delivered', 'failed', 'cancelled'].includes(status);

    // Calculate stats from deliveries
    const stats = {
        completed: deliveries.filter(d => d.status === 'delivered').length,
        active: deliveries.filter(d => ['picked_up', 'shipped'].includes(d.status)).length,
        upcoming: deliveries.filter(d => ['created', 'confirmed'].includes(d.status)).length,
    };

    const normalize = (str: string) =>
        (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    const filteredDeliveries = searchQuery.trim()
        ? deliveries.filter(d => {
              const q = normalize(searchQuery);
              if (isUnlocked(d.id, d.status)) {
                  return (
                      normalize(d.delivery_number).includes(q) ||
                      normalize(d.delivery_address_text).includes(q) ||
                      normalize(d.dest_city).includes(q) ||
                      normalize(d.client?.company_name).includes(q) ||
                      normalize(d.region?.name).includes(q)
                  );
              }
              return (
                  normalize(d.delivery_number).includes(q) ||
                  normalize(d.dest_city).includes(q)
              );
          })
        : deliveries;

    const renderDeliveryCard = ({ item }: { item: any }) => {
        const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
        const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal;

        if (!isUnlocked(item.id, item.status)) {
            return (
                <View style={[styles.card, styles.lockedCard]}>
                    <View style={styles.cardTopRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[styles.statusText, { color: statusInfo.text }]}>
                                {statusInfo.label}
                            </Text>
                        </View>
                        <Text style={[styles.deliveryNumber, { color: '#2563eb' }]}>
                            {item.delivery_number}
                        </Text>
                    </View>
                    {item.dest_city ? (
                        <Text style={styles.lockedCity}>{item.dest_city}</Text>
                    ) : null}
                    <View style={styles.lockedHint}>
                        <Ionicons name="lock-closed-outline" size={14} color="#9ca3af" />
                        <Text style={styles.lockedText}>Scan barcode to unlock details</Text>
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/delivery/[id]', params: { id: item.id } })}
                activeOpacity={0.7}
            >
                {/* Status + Delivery Number */}
                <View style={styles.cardTopRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusText, { color: statusInfo.text }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                    <Text style={[styles.deliveryNumber, { color: '#2563eb' }]}>
                        {item.delivery_number}
                    </Text>
                </View>

                {/* Priority */}
                <View style={styles.priorityRow}>
                    <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                    <Text style={styles.priorityText}>{item.priority}</Text>
                </View>

                {/* Client */}
                {item.client && (
                    <View style={styles.clientRow}>
                        <Ionicons name="person-outline" size={18} color="#6b7280" style={{ marginRight: 10 }} />
                        <View>
                            <Text style={styles.clientName}>{item.client.company_name}</Text>
                            {item.client.contact_phone && (
                                <Text style={styles.clientPhone}>{item.client.contact_phone}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Addresses */}
                <View style={styles.addressSection}>
                    {item.pickup_address_text && (
                        <View style={styles.addressRow}>
                            <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.addressLabel}>Picked up from</Text>
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {item.pickup_address_text}
                                </Text>
                            </View>
                        </View>
                    )}
                    {item.delivery_address_text && (
                        <View style={styles.addressRow}>
                            <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.addressLabel}>Deliver to</Text>
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {item.delivery_address_text}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Special Instructions */}
                {item.special_instructions && (
                    <View style={styles.notesBox}>
                        <Ionicons name="warning-outline" size={14} color="#92400e" style={{ marginRight: 8 }} />
                        <Text style={styles.notesText} numberOfLines={2}>
                            {item.special_instructions}
                        </Text>
                    </View>
                )}

                {/* Items Count */}
                {item.items && item.items.length > 0 && (
                    <View style={styles.itemsRow}>
                        <Ionicons name="cube-outline" size={14} color="#6b7280" style={{ marginRight: 6 }} />
                        <Text style={styles.itemsText}>
                            {item.items.length} item{item.items.length > 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Blue Header — matches Figma */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SwiftDeliver</Text>
                <Text style={styles.headerSubtitle}>Driver Portal</Text>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.completed}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardMiddle]}>
                        <Text style={styles.statNumber}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.upcoming}</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </View>
                </View>
            </View>

            {/* Top staff banner */}
            {myRank === 1 && myCompleted > 0 && (
                <View style={styles.topBanner}>
                    <Ionicons name="trophy" size={20} color="#92400e" style={{ marginRight: 8 }} />
                    <View>
                        <Text style={styles.topBannerTitle}>Top Delivery Staff This Month</Text>
                        <Text style={styles.topBannerSub}>{myCompleted} deliveries completed — keep it up!</Text>
                    </View>
                </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by number, address, city..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {filteredDeliveries.length > 0 ? 'Your Deliveries' : 'No Results'}
                </Text>
                <Text style={styles.sectionCount}>{filteredDeliveries.length} shown</Text>
            </View>

            {/* Delivery List */}
            {filteredDeliveries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons
                    name={searchQuery ? 'search-outline' : 'mail-unread-outline'}
                    size={64}
                    color="#9ca3af"
                    style={{ marginBottom: 16 }}
                />
                    <Text style={styles.emptyTitle}>{searchQuery ? 'No matches found' : 'No deliveries assigned'}</Text>
                    <Text style={styles.emptySubtitle}>{searchQuery ? 'Try a different search term' : 'Pull down to refresh'}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDeliveries}
                    renderItem={renderDeliveryCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 16 },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        padding: 4,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    statCardMiddle: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
    },
    statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

    topBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        marginHorizontal: 20,
        marginTop: 14,
        borderRadius: 12,
        padding: 14,
    },
    topBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
    topBannerSub: { fontSize: 12, color: '#b45309', marginTop: 1 },

    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 4,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
    sectionCount: { fontSize: 13, color: '#9ca3af' },

    card: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 14,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600' },
    deliveryNumber: { fontSize: 14, fontWeight: '700' },

    priorityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    priorityText: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },

    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    clientIcon: { fontSize: 18, marginRight: 10 },
    clientName: { fontSize: 15, fontWeight: '600', color: '#111' },
    clientPhone: { fontSize: 13, color: '#6b7280', marginTop: 1 },

    addressSection: { marginBottom: 12 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    addressDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 4 },
    addressTextContainer: { flex: 1 },
    addressLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
    addressText: { fontSize: 13, color: '#374151' },

    notesBox: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    notesIcon: { fontSize: 14, marginRight: 8 },
    notesText: { fontSize: 12, color: '#92400e', flex: 1 },

    itemsRow: { flexDirection: 'row', alignItems: 'center' },
    itemsIcon: { fontSize: 14, marginRight: 6 },
    itemsText: { fontSize: 12, color: '#6b7280' },

    listContent: { paddingBottom: 20 },

    lockedCard: { opacity: 0.85 },
    lockedCity: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
    lockedHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    lockedText: { fontSize: 12, color: '#9ca3af' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af' },
});