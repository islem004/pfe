import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getUnlockedIds } from '../../utils/unlockedDeliveries';
import api from '../../services/api';

const STATUS_FLOW = ['created', 'confirmed', 'picked_up', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
    created:   'Created',
    confirmed: 'Confirmed',
    picked_up: 'Picked Up',
    shipped:   'Shipped',
    delivered: 'Delivered',
    failed:    'Failed',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    created:   { bg: '#ffedd5', text: '#9a3412' },
    confirmed: { bg: '#ede9fe', text: '#5b21b6' },
    picked_up: { bg: '#dbeafe', text: '#1e40af' },
    shipped:   { bg: '#f5f3ff', text: '#4c1d95' },
    delivered: { bg: '#dcfce7', text: '#14532d' },
    failed:    { bg: '#fee2e2', text: '#991b1b' },
    cancelled: { bg: '#f1f5f9', text: '#475569' },
};

export default function DeliveryDetailScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();

    const [delivery, setDelivery] = useState<any>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [showStatusPicker, setShowStatusPicker] = useState(false);

    // Failure modal
    const [showFailureModal, setShowFailureModal] = useState(false);
    const [failureReason, setFailureReason] = useState('');

    // Proof-of-delivery modal (mandatory before marking delivered)
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofUri, setProofUri] = useState<string | null>(null);

    const fetchDelivery = async () => {
        try {
            const response = await api.get(`/staff/deliveries/${id}`);
            const data = response.data;
            setDelivery(data);

            // Check if unlocked
            const autoUnlocked = ['delivered', 'failed', 'cancelled'].includes(data.status);
            if (autoUnlocked) {
                setIsUnlocked(true);
            } else if (user?.id) {
                const ids = await getUnlockedIds(user.id);
                setIsUnlocked(ids.has(data.id));
            }
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

    const updateStatus = async (newStatus: string, notesOverride?: string) => {
        setUpdating(true);
        try {
            const response = await api.put(`/staff/deliveries/${id}/status`, {
                status: newStatus,
                notes: notesOverride || notes || `Status updated to ${newStatus}`,
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

    // Intercepts "Mark as Delivered" — opens proof modal instead
    const handleDeliveredPress = () => {
        setProofUri(null);
        setShowProofModal(true);
    };

    // Called from proof modal: uploads proof then marks delivered atomically
    const handleDeliveredSubmit = async () => {
        if (!proofUri) return;
        setUpdating(true);
        setShowProofModal(false);
        try {
            // 1. Mark delivered
            const statusResp = await api.put(`/staff/deliveries/${id}/status`, {
                status: 'delivered',
                notes: notes || 'Delivered and confirmed',
            });

            // 2. Upload proof
            const formData = new FormData();
            formData.append('photo', { uri: proofUri, type: 'image/jpeg', name: 'proof.jpg' } as any);
            formData.append('notes', 'Proof of delivery');
            await api.post(`/staff/deliveries/${id}/proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setDelivery(statusResp.data.delivery);
            setNotes('');
            setShowStatusPicker(false);
            setProofUri(null);
            // Refresh to pull in the proof record
            await fetchDelivery();
            Alert.alert('Success', 'Delivery confirmed and proof uploaded.');
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            Alert.alert('Error', msg);
            // Refresh so UI reflects whatever did/didn't change
            await fetchDelivery();
        } finally {
            setUpdating(false);
        }
    };

    const handleFailedSubmit = async () => {
        if (failureReason.trim().length < 10) {
            Alert.alert('Required', 'Please describe the issue (at least 10 characters).');
            return;
        }
        setShowFailureModal(false);
        await updateStatus('failed', failureReason.trim());
        setFailureReason('');
    };

    const getNextStatus = () => {
        if (!delivery) return null;
        const idx = STATUS_FLOW.indexOf(delivery.status);
        return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
    };

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    // ── Not found ────────────────────────────────────────────────────
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

    // ── Locked — scan required ───────────────────────────────────────
    if (!isUnlocked) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{delivery.delivery_number}</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.lockContainer}>
                    <Ionicons name="lock-closed-outline" size={52} color="#9ca3af" style={{ marginBottom: 16 }} />
                    <Text style={styles.lockTitle}>Scan Required</Text>
                    <Text style={styles.lockSubtitle}>
                        Scan this delivery's barcode on the Scan tab to unlock its details.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Full detail view ─────────────────────────────────────────────
    const statusInfo = STATUS_COLORS[delivery.status] || STATUS_COLORS.created;
    const nextStatus = getNextStatus();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{delivery.delivery_number}</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Status + Priority */}
                <View style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                                {STATUS_LABELS[delivery.status]}
                            </Text>
                        </View>
                        <Text style={styles.priorityText}>Priority: {delivery.priority}</Text>
                    </View>
                </View>

                {/* Client */}
                {delivery.client && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Client</Text>
                        <Text style={styles.clientName}>{delivery.client.company_name}</Text>
                        {delivery.client.contact_phone && (
                            <View style={styles.clientDetailRow}>
                                <Ionicons name="call-outline" size={14} color="#6b7280" style={{ marginRight: 6 }} />
                                <Text style={styles.clientDetail}>{delivery.client.contact_phone}</Text>
                            </View>
                        )}
                        {delivery.client.contact_email && (
                            <View style={styles.clientDetailRow}>
                                <Ionicons name="mail-outline" size={14} color="#6b7280" style={{ marginRight: 6 }} />
                                <Text style={styles.clientDetail}>{delivery.client.contact_email}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Route */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Route</Text>
                    <View style={styles.addressBlock}>
                        <View style={styles.addressDotLine}>
                            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                        </View>
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
                        <View style={styles.etaRow}>
                            <Ionicons name="calendar-outline" size={13} color="#6b7280" style={{ marginRight: 6 }} />
                            <Text style={styles.eta}>
                                ETA: {new Date(delivery.scheduled_delivery_time).toLocaleString('fr-TN')}
                            </Text>
                        </View>
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

                {/* Special Instructions */}
                {delivery.special_instructions && (
                    <View style={[styles.card, styles.warningCard]}>
                        <View style={styles.warningTitleRow}>
                            <Ionicons name="warning-outline" size={16} color="#92400e" style={{ marginRight: 6 }} />
                            <Text style={styles.warningTitle}>Important Notes</Text>
                        </View>
                        <Text style={styles.warningText}>{delivery.special_instructions}</Text>
                    </View>
                )}

                {/* Status History */}
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
                                    {h.notes && <Text style={styles.historyNotes}>{h.notes}</Text>}
                                    <Text style={styles.historyTime}>
                                        {new Date(h.created_at).toLocaleString('fr-TN')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Proof already uploaded */}
                {delivery.proof_of_delivery && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Proof of Delivery</Text>
                        <View style={styles.proofDone}>
                            <Ionicons name="checkmark-circle" size={20} color="#065f46" style={{ marginRight: 8 }} />
                            <Text style={styles.proofDoneText}>Proof uploaded successfully</Text>
                        </View>
                    </View>
                )}

                {/* Update Status — only if not terminal */}
                {delivery.status !== 'delivered' && delivery.status !== 'failed' && delivery.status !== 'cancelled' && (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Update Status</Text>

                        <TextInput
                            style={styles.notesInput}
                            placeholder="Add notes (optional)"
                            placeholderTextColor="#9ca3af"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        {nextStatus && (
                            <TouchableOpacity
                                style={styles.nextStatusButton}
                                onPress={() => nextStatus === 'delivered' ? handleDeliveredPress() : updateStatus(nextStatus)}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.nextStatusButtonText}>
                                        Mark as {STATUS_LABELS[nextStatus]}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

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
                                <TouchableOpacity
                                    style={[styles.statusOption, { backgroundColor: STATUS_COLORS.failed.bg }]}
                                    onPress={() => setShowFailureModal(true)}
                                    disabled={updating}
                                >
                                    <Text style={[styles.statusOptionText, { color: STATUS_COLORS.failed.text }]}>
                                        {STATUS_LABELS.failed}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusOption, { backgroundColor: STATUS_COLORS.cancelled.bg }]}
                                    onPress={() => updateStatus('cancelled')}
                                    disabled={updating}
                                >
                                    <Text style={[styles.statusOptionText, { color: STATUS_COLORS.cancelled.text }]}>
                                        {STATUS_LABELS.cancelled}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Proof-of-delivery modal (mandatory before marking delivered) */}
            <Modal
                visible={showProofModal}
                transparent
                animationType="fade"
                onRequestClose={() => { setShowProofModal(false); setProofUri(null); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Proof of Delivery Required</Text>
                        <Text style={styles.modalSubtitle}>
                            A photo is required to confirm this delivery.
                        </Text>

                        {proofUri ? (
                            <>
                                <Image source={{ uri: proofUri }} style={styles.proofPreview} />
                                <TouchableOpacity
                                    style={styles.changePhotoBtn}
                                    onPress={() => setProofUri(null)}
                                >
                                    <Text style={styles.changePhotoText}>Change photo</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.proofButtons}>
                                <TouchableOpacity
                                    style={styles.proofButton}
                                    onPress={async () => {
                                        const result = await ImagePicker.launchCameraAsync({
                                            mediaTypes: ['images'], quality: 0.7,
                                        });
                                        if (!result.canceled && result.assets[0]) {
                                            setProofUri(result.assets[0].uri);
                                        }
                                    }}
                                >
                                    <Ionicons name="camera-outline" size={28} color="#2563eb" style={{ marginBottom: 6 }} />
                                    <Text style={styles.proofButtonText}>Take Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.proofButton}
                                    onPress={async () => {
                                        const result = await ImagePicker.launchImageLibraryAsync({
                                            mediaTypes: ['images'], quality: 0.7,
                                        });
                                        if (!result.canceled && result.assets[0]) {
                                            setProofUri(result.assets[0].uri);
                                        }
                                    }}
                                >
                                    <Ionicons name="image-outline" size={28} color="#2563eb" style={{ marginBottom: 6 }} />
                                    <Text style={styles.proofButtonText}>From Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => { setShowProofModal(false); setProofUri(null); }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalSubmitButton,
                                    styles.modalSubmitGreen,
                                    !proofUri && styles.modalSubmitDisabled,
                                ]}
                                onPress={handleDeliveredSubmit}
                                disabled={!proofUri || updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Confirm Delivery</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Failure reason modal */}
            <Modal
                visible={showFailureModal}
                transparent
                animationType="fade"
                onRequestClose={() => { setShowFailureModal(false); setFailureReason(''); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Report Delivery Failure</Text>
                        <Text style={styles.modalSubtitle}>
                            Describe what prevented this delivery from being completed.
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Customer not home, wrong address, access denied..."
                            placeholderTextColor="#9ca3af"
                            value={failureReason}
                            onChangeText={setFailureReason}
                            multiline
                            autoFocus
                        />
                        <Text style={styles.modalCharCount}>
                            {failureReason.trim().length} / 10 min
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => { setShowFailureModal(false); setFailureReason(''); }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalSubmitButton,
                                    failureReason.trim().length < 10 && styles.modalSubmitDisabled,
                                ]}
                                onPress={handleFailedSubmit}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Submit Report</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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

    // Lock screen
    lockContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 40,
    },
    lockTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
    lockSubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

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
        fontSize: 13, fontWeight: '700', color: '#6b7280',
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    },

    // Status
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusBadgeText: { fontSize: 14, fontWeight: '700' },
    priorityText: { fontSize: 13, color: '#6b7280', textTransform: 'capitalize' },

    // Client
    clientName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
    clientDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    clientDetail: { fontSize: 13, color: '#6b7280' },

    // Route
    addressBlock: { flexDirection: 'row' },
    addressDotLine: { alignItems: 'center', marginRight: 14, paddingTop: 4 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    line: { width: 2, height: 30, backgroundColor: '#d1d5db', marginVertical: 2 },
    addressTexts: { flex: 1 },
    addressItem: {},
    addressItemLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
    addressItemText: { fontSize: 14, color: '#111' },
    etaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    eta: { fontSize: 13, color: '#6b7280' },

    // Items
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    itemName: { fontSize: 14, color: '#374151' },
    itemQty: { fontSize: 14, color: '#6b7280', fontWeight: '600' },

    // Warning
    warningCard: { backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
    warningTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    warningTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
    warningText: { fontSize: 13, color: '#92400e' },

    // History
    historyRow: { flexDirection: 'row', marginBottom: 12 },
    historyDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#2563eb', marginTop: 5, marginRight: 10,
    },
    historyContent: { flex: 1 },
    historyStatus: { fontSize: 14, fontWeight: '600', color: '#111' },
    historyNotes: { fontSize: 12, color: '#6b7280', marginTop: 1 },
    historyTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

    // Proof done badge
    proofDone: { flexDirection: 'row', alignItems: 'center' },
    proofDoneText: { fontSize: 14, color: '#065f46', fontWeight: '600' },

    // Update status
    notesInput: {
        backgroundColor: '#f9fafb', borderRadius: 10, padding: 12,
        fontSize: 14, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
        minHeight: 60, textAlignVertical: 'top', marginBottom: 12,
    },
    nextStatusButton: {
        backgroundColor: '#2563eb', padding: 16, borderRadius: 12,
        alignItems: 'center', marginBottom: 8,
    },
    nextStatusButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    otherStatusButton: { alignItems: 'center', padding: 8 },
    otherStatusText: { color: '#6b7280', fontSize: 13 },
    statusOptions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    statusOption: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    statusOptionText: { fontWeight: '600', fontSize: 13 },

    // Shared modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 6 },
    modalSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancelButton: {
        flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    modalCancelText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
    modalSubmitButton: {
        flex: 1, backgroundColor: '#ef4444', padding: 14, borderRadius: 12, alignItems: 'center',
    },
    modalSubmitGreen: { backgroundColor: '#22c55e' },
    modalSubmitDisabled: { opacity: 0.4 },
    modalSubmitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // Failure modal extras
    modalInput: {
        backgroundColor: '#f9fafb', borderRadius: 10, padding: 12,
        fontSize: 14, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
        minHeight: 80, textAlignVertical: 'top', marginBottom: 4,
    },
    modalCharCount: { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginBottom: 16 },

    // Proof modal extras
    proofPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
    changePhotoBtn: { alignItems: 'center', marginBottom: 16 },
    changePhotoText: { fontSize: 13, color: '#6b7280' },
    proofButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    proofButton: {
        flex: 1, backgroundColor: '#f0f7ff', borderRadius: 12, padding: 16,
        alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe',
    },
    proofButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});
