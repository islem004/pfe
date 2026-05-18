import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/staff/notifications');
            setNotifications(response.data);
        } catch (error: any) {
            console.log('Failed to fetch notifications:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/staff/notifications/${id}/read`);
            // Update locally without re-fetching
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        } catch (error: any) {
            console.log('Mark read error:', error.message);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/staff/notifications/read-all');
            // Update all locally
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
        } catch (error: any) {
            console.log('Mark all read error:', error.message);
        }
    };

    const renderNotification = ({ item }: { item: any }) => {
        const isUnread = !item.read_at;
        return (
            <TouchableOpacity
                style={[styles.notifCard, isUnread && styles.notifUnread]}
                onPress={() => isUnread && markAsRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.notifRow}>
                    <View style={[styles.notifDot, isUnread && styles.notifDotActive]} />
                    <View style={styles.notifContent}>
                        <Text style={[styles.notifTitle, isUnread && styles.notifTitleBold]}>
                            {item.title || 'Notification'}
                        </Text>
                        <Text style={styles.notifBody} numberOfLines={2}>
                            {item.message || item.body || ''}
                        </Text>
                        <Text style={styles.notifTime}>
                            {new Date(item.created_at).toLocaleDateString('fr-TN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                </View>
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.some(n => !n.read_at) && (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* List or Empty */}
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-outline" size={64} color="#9ca3af" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>No notifications</Text>
                    <Text style={styles.emptySubtitle}>You're all caught up!</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    markAllText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },

    notifCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 10,
        borderRadius: 12,
        padding: 14,
    },
    notifUnread: {
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
    notifDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e5e7eb',
        marginTop: 6,
        marginRight: 10,
    },
    notifDotActive: { backgroundColor: '#2563eb' },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 14, color: '#374151', marginBottom: 2 },
    notifTitleBold: { fontWeight: '700', color: '#111' },
    notifBody: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
    notifTime: { fontSize: 11, color: '#9ca3af' },

    listContent: { paddingBottom: 20 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIcon: { marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af' },
});