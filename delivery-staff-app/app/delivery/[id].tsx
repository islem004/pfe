import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

const STATUS_FLOW = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
    pending:    'Pending',
    confirmed:  'Confirmed',
    picked_up:  'Picked Up',
    in_transit: 'In Transit',
    delivered:  'Delivered',
    failed:     'Failed',
    cancelled:  'Cancelled',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending:    { bg: '#fef3c7', text: '#92400e' },
    confirmed:  { bg: '#dbeafe', text: '#1e40af' },
    picked_up:  { bg: '#ede9fe', text: '#5b21b6' },
    in_transit: { bg: '#d1fae5', text: '#065f46' },
    delivered:  { bg: '#dcfce7', text: '#14532d' },
    failed:     { bg: '#fee2e2', text: '#991b1b' },
    cancelled:  { bg: '#f1f5f9', text: '#475569' },
};

export default function DeliveryDetailScreen() {
    const { id } = useLocalSearchParams();
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [showStatusPicker, setShowStatusPicker] = useState(false);

    const fetchDelivery = async () => {
        try {
            const response = await api.get(`/staff/deliveries/${id}`);
            setDelivery(response.data);
        } catch (error: any) {
            console.log('Failed to fetch delivery:', error.message);
            Alert.alert('Error', 'Failed to load delivery');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDelivery();
    }, [id]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const response = await api.put(`/staff/deliveries/${id}/status`, {
                status: newStatus,
                notes: notes || `Status updated to ${newStatus}`,
            });
            setDelivery(response.data.delivery);
            setNotes('');
            setShowStatusPicker(false);
            Alert.alert('Success', `Status updated to ${STATUS_LABELS[newStatus]}`);
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            Alert.alert('Error', msg);
        } finally {
            setUpdating(false);
        }
    };
    const uploadProof = async (imageUri: string) => {
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('photo', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'proof.jpg',
            } as any);
            formData.append('notes', 'Delivered and confirmed');

            const response = await api.post(
                `/staff/deliveries/${id}/proof`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            Alert.alert('Success', 'Proof uploaded!');
            fetchDelivery(); // Refresh to show proof
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            Alert.alert('Error', 'Failed to upload proof: ' + msg);
        } finally {
            setUpdating(false);
        }
    };

    // Figures out the next logical status
    const getNextStatus = () => {
        if (!delivery) return null;
        const currentIndex = STATUS_FLOW.indexOf(delivery.status);
        if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
            return STATUS_FLOW[currentIndex + 1];
        }
        return null;
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

    if (!delivery) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Delivery not found</Text>
                    <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
                        <Text style={styles.backLinkText}>← Go back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusInfo = STATUS_COLORS[delivery.status] || STATUS_COLORS.draft;
    const nextStatus = getNextStatus();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{delivery.delivery_number}</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Status + Priority Card */}
                <View style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                                {STATUS_LABELS[delivery.status]}
                            </Text>
                        </View>
                        <Text style={styles.priorityText}>
                            Priority: {delivery.priority}
                        </Text>
                    </View>
                </View>

                {/* Client Info */}
                {delivery.client && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Client</Text>
                        <Text style={styles.clientName}>{delivery.client.company_name}</Text>
                        {delivery.client.contact_phone && (
                            <Text style={styles.clientDetail}>📞 {delivery.client.contact_phone}</Text>
                        )}
                        {delivery.client.contact_email && (
                            <Text style={styles.clientDetail}>📧 {delivery.client.contact_email}</Text>
                        )}
                    </View>
                )}

                {/* Route — Pickup to Delivery with visual line */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Route</Text>

                    <View style={styles.addressBlock}>
                        {/* Green dot → line → Red dot */}
                        <View style={styles.addressDotLine}>
                            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                        </View>

                        {/* Address texts next to the dots */}
                        <View style={styles.addressTexts}>
                            <View style={styles.addressItem}>
                                <Text style={styles.addressItemLabel}>Pickup</Text>
                                <Text style={styles.addressItemText}>
                                    {delivery.pickup_address_text || 'Not specified'}
                                </Text>
                            </View>
                            <View style={[styles.addressItem, { marginTop: 20 }]}>
                                <Text style={styles.addressItemLabel}>Deliver to</Text>
                                <Text style={styles.addressItemText}>
                                    {delivery.delivery_address_text || 'Not specified'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {delivery.scheduled_delivery_time && (
                        <Text style={styles.eta}>
                            📅 ETA: {new Date(delivery.scheduled_delivery_time).toLocaleString('fr-TN')}
                        </Text>
                    )}
                </View>

                {/* Package Items */}
                {delivery.items && delivery.items.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>
                            Package Details ({delivery.items.length} item{delivery.items.length > 1 ? 's' : ''})
                        </Text>
                        {delivery.items.map((item: any) => (
                            <View key={item.id} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.item_name}</Text>
                                <Text style={styles.itemQty}>×{item.quantity}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Special Instructions — yellow warning box */}
                {delivery.special_instructions && (
                    <View style={[styles.card, styles.warningCard]}>
                        <Text style={styles.warningTitle}>⚠️ Important Notes</Text>
                        <Text style={styles.warningText}>{delivery.special_instructions}</Text>
                    </View>
                )}

                {/* Status History Timeline */}
                {delivery.status_histories && delivery.status_histories.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Status History</Text>
                        {delivery.status_histories.map((h: any, i: number) => (
                            <View key={i} style={styles.historyRow}>
                                <View style={styles.historyDot} />
                                <View style={styles.historyContent}>
                                    <Text style={styles.historyStatus}>
                                        {STATUS_LABELS[h.status] || h.status}
                                    </Text>
                                    {h.notes && (
                                        <Text style={styles.historyNotes}>{h.notes}</Text>
                                    )}
                                    <Text style={styles.historyTime}>
                                        {new Date(h.created_at).toLocaleString('fr-TN')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                {/* Proof of Delivery — shows for delivered status */}
                {delivery.status === 'delivered' && !delivery.proof_of_delivery && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Proof of Delivery</Text>
                        <Text style={styles.proofHint}>
                            Take a photo as proof of delivery
                        </Text>

                        <View style={styles.proofButtons}>
                            <TouchableOpacity
                                style={styles.proofButton}
                                onPress={async () => {
                                    const result = await ImagePicker.launchCameraAsync({
                                        mediaTypes: ['images'],
                                        quality: 0.7,
                                    });

                                    if (!result.canceled && result.assets[0]) {
                                        uploadProof(result.assets[0].uri);
                                    }
                                }}
                            >
                                <Text style={styles.proofButtonIcon}>📸</Text>
                                <Text style={styles.proofButtonText}>Take Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.proofButton}
                                onPress={async () => {
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ['images'],
                                        quality: 0.7,
                                    });

                                    if (!result.canceled && result.assets[0]) {
                                        uploadProof(result.assets[0].uri);
                                    }
                                }}
                            >
                                <Text style={styles.proofButtonIcon}>🖼️</Text>
                                <Text style={styles.proofButtonText}>From Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Proof already uploaded */}
                {delivery.proof_of_delivery && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Proof of Delivery</Text>
                        <View style={styles.proofDone}>
                            <Text style={styles.proofDoneIcon}>✅</Text>
                            <Text style={styles.proofDoneText}>Proof uploaded successfully</Text>
                        </View>
                    </View>
                )}

                {/* Update Status Section — only if not already delivered/failed */}
                {delivery.status !== 'delivered' && delivery.status !== 'failed' && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Update Status</Text>

                        {/* Notes input */}
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Add notes (optional)"
                            placeholderTextColor="#9ca3af"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        {/* Main action — next status in flow */}
                        {nextStatus && (
                            <TouchableOpacity
                                style={styles.nextStatusButton}
                                onPress={() => updateStatus(nextStatus)}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.nextStatusButtonText}>
                                        ✅ Mark as {STATUS_LABELS[nextStatus]}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Toggle for problem/failed options */}
                        <TouchableOpacity
                            style={styles.otherStatusButton}
                            onPress={() => setShowStatusPicker(!showStatusPicker)}
                        >
                            <Text style={styles.otherStatusText}>
                                {showStatusPicker ? 'Hide options' : 'Report issue'}
                            </Text>
                        </TouchableOpacity>

                        {showStatusPicker && (
                            <View style={styles.statusOptions}>
                                {['failed', 'problem'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.statusOption, { backgroundColor: STATUS_COLORS[s].bg }]}
                                        onPress={() => updateStatus(s)}
                                        disabled={updating}
                                    >
                                        <Text style={[styles.statusOptionText, { color: STATUS_COLORS[s].text }]}>
                                            {STATUS_LABELS[s]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Bottom spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
    backLink: { padding: 8 },
    backLinkText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
    scroll: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: { paddingVertical: 4, paddingRight: 8 },
    backText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },

    // Card
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 14,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Status
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusBadgeText: { fontSize: 14, fontWeight: '700' },
    priorityText: { fontSize: 13, color: '#6b7280', textTransform: 'capitalize' },

    // Client
    clientName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
    clientDetail: { fontSize: 13, color: '#6b7280', marginBottom: 2 },

    // Route addresses with dot-line visual
    addressBlock: { flexDirection: 'row' },
    addressDotLine: { alignItems: 'center', marginRight: 14, paddingTop: 4 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    line: { width: 2, height: 30, backgroundColor: '#d1d5db', marginVertical: 2 },
    addressTexts: { flex: 1 },
    addressItem: {},
    addressItemLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
    addressItemText: { fontSize: 14, color: '#111' },
    eta: { fontSize: 13, color: '#6b7280', marginTop: 12 },

    // Items
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    itemName: { fontSize: 14, color: '#374151' },
    itemQty: { fontSize: 14, color: '#6b7280', fontWeight: '600' },

    // Warning box
    warningCard: { backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
    warningTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 },
    warningText: { fontSize: 13, color: '#92400e' },

    // Status history
    historyRow: { flexDirection: 'row', marginBottom: 12 },
    historyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563eb',
        marginTop: 5,
        marginRight: 10,
    },
    historyContent: { flex: 1 },
    historyStatus: { fontSize: 14, fontWeight: '600', color: '#111' },
    historyNotes: { fontSize: 12, color: '#6b7280', marginTop: 1 },
    historyTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

    // Update status
    notesInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#111',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    nextStatusButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    nextStatusButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    otherStatusButton: { alignItems: 'center', padding: 8 },
    otherStatusText: { color: '#6b7280', fontSize: 13 },
    statusOptions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    statusOption: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    statusOptionText: { fontWeight: '600', fontSize: 13 },
    // Proof of delivery
    proofHint: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
    proofButtons: { flexDirection: 'row', gap: 12 },
    proofButton: {
        flex: 1,
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    proofButtonIcon: { fontSize: 28, marginBottom: 6 },
    proofButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
    proofDone: { flexDirection: 'row', alignItems: 'center' },
    proofDoneIcon: { fontSize: 20, marginRight: 8 },
    proofDoneText: { fontSize: 14, color: '#065f46', fontWeight: '600' },
});