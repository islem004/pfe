import { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { unlockDelivery } from '../../utils/unlockedDeliveries';
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

export default function ScanScreen() {
    const { user } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');
    const [showManual, setShowManual] = useState(false);

    const handleBarcodeScan = async (barcodeValue: string) => {
        setSearching(true);
        setResult(null);
        setError('');

        try {
            const response = await api.post('/staff/scan', {
                barcode_value: barcodeValue.trim(),
            });
            setResult(response.data);
            if (user?.id && response.data?.id) {
                await unlockDelivery(user.id, response.data.id);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Delivery not found';
            setError(msg);
        } finally {
            setSearching(false);
        }
    };

    const onBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned || searching) return;
        setScanned(true);
        handleBarcodeScan(data);
    };

    const handleManualSearch = () => {
        if (!manualBarcode.trim()) {
            Alert.alert('Error', 'Please enter a barcode value');
            return;
        }
        setScanned(true);
        handleBarcodeScan(manualBarcode);
    };

    const resetScan = () => {
        setScanned(false);
        setResult(null);
        setError('');
        setManualBarcode('');
    };

    const statusInfo = result ? (STATUS_COLORS[result.status] || STATUS_COLORS.draft) : null;

    // Camera permission not yet determined
    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    // Camera permission denied
    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centerContent}>
                    <Ionicons name="camera-outline" size={64} color="#9ca3af" style={{ marginBottom: 16 }} />
                    <Text style={styles.permTitle}>Camera Access Needed</Text>
                    <Text style={styles.permText}>
                        We need camera access to scan delivery barcodes
                    </Text>
                    <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
                        <Text style={styles.permButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Scan Barcode</Text>
                <TouchableOpacity onPress={() => setShowManual(!showManual)}>
                    <Text style={styles.toggleText}>
                        {showManual ? 'Use Camera' : 'Type Manually'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Camera or Manual Input */}
            {!showManual ? (
                <View style={styles.cameraContainer}>
                    {!scanned && (
                        <CameraView
                            style={styles.camera}
                            barcodeScannerSettings={{
                                barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr'],
                            }}
                            onBarcodeScanned={onBarcodeScanned}
                        >
                            <View style={styles.overlay}>
                                <View style={styles.scanFrame} />
                                <Text style={styles.scanHint}>
                                    Point camera at delivery barcode
                                </Text>
                            </View>
                        </CameraView>
                    )}

                    {scanned && !searching && !result && !error && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#2563eb" />
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.manualSection}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter barcode value"
                            placeholderTextColor="#9ca3af"
                            value={manualBarcode}
                            onChangeText={setManualBarcode}
                            autoCapitalize="characters"
                            returnKeyType="search"
                            onSubmitEditing={handleManualSearch}
                        />
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleManualSearch}
                            disabled={searching}
                        >
                            {searching ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.searchButtonText}>Search</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Loading */}
            {searching && (
                <View style={styles.resultSection}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.searchingText}>Searching...</Text>
                </View>
            )}

            {/* Error */}
            {error !== '' && (
                <View style={styles.resultSection}>
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <TouchableOpacity style={styles.scanAgainButton} onPress={resetScan}>
                        <Text style={styles.scanAgainText}>Scan Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Result */}
            {result && statusInfo && (
                <View style={styles.resultSection}>
                    <View style={styles.resultCard}>
                        <View style={styles.resultTopRow}>
                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                                    {statusInfo.label}
                                </Text>
                            </View>
                            <Text style={styles.deliveryNumber}>{result.delivery_number}</Text>
                        </View>

                        {result.client && (
                            <View style={styles.resultDetailRow}>
                                <Ionicons name="person-outline" size={14} color="#6b7280" />
                                <Text style={styles.resultDetailText}>{result.client.company_name}</Text>
                            </View>
                        )}

                        {result.delivery_address_text && (
                            <View style={styles.resultDetailRow}>
                                <Ionicons name="location-outline" size={14} color="#6b7280" />
                                <Text style={styles.resultDetailText}>{result.delivery_address_text}</Text>
                            </View>
                        )}

                        {result.items && (
                            <View style={styles.resultDetailRow}>
                                <Ionicons name="cube-outline" size={14} color="#6b7280" />
                                <Text style={styles.resultDetailText}>
                                    {result.items.length} item{result.items.length > 1 ? 's' : ''}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push({
                                pathname: '/delivery/[id]',
                                params: { id: result.id },
                            })}
                        >
                            <Text style={styles.viewButtonText}>View Full Details</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.scanAgainButton} onPress={resetScan}>
                        <Text style={styles.scanAgainText}>Scan Another</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    toggleText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },

    // Camera
    cameraContainer: { height: 300, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
    scanFrame: {
        width: 220,
        height: 220,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    scanHint: { color: '#fff', fontSize: 14, marginTop: 16, textAlign: 'center' },

    // Manual
    manualSection: { paddingHorizontal: 20, paddingTop: 16 },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#111',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // Permission
    permIcon: {},
    permTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 },
    permText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
    permButton: { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    permButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Results
    resultSection: { padding: 20 },
    searchingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },

    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText: { color: '#991b1b', fontSize: 14 },

    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    resultTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600' },
    deliveryNumber: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
    resultDetail: { fontSize: 14, color: '#374151', marginBottom: 6 },
    resultDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    resultDetailText: { fontSize: 14, color: '#374151', flex: 1 },
    viewButton: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    viewButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    scanAgainButton: {
        alignItems: 'center',
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#2563eb',
        borderRadius: 12,
    },
    scanAgainText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
});