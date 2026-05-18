import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfileScreen() {
    const { user, logout, updateUser } = useAuth();
    const staff = user?.staff;

    const [phone, setPhone] = useState<string>(user?.phone || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const hasChanges = phone !== (user?.phone || '') || avatarUri !== null;

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to your photo library to change your profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
            Alert.alert('Invalid phone', 'Phone must be 8–15 digits, optionally starting with +.');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('phone', phone);
            if (avatarUri) {
                const filename = avatarUri.split('/').pop() || 'avatar.jpg';
                const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType =
                    ext === 'png' ? 'image/png' :
                    ext === 'webp' ? 'image/webp' : 'image/jpeg';
                formData.append('avatar', { uri: avatarUri, name: filename, type: mimeType } as any);
            }
            const resp = await api.post('/staff/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser(resp.data.user);
            setAvatarUri(null);
            Alert.alert('Saved', 'Profile updated successfully.');
        } catch (err: any) {
            const errors = err.response?.data?.errors;
            const msg = errors?.phone?.[0] || errors?.avatar?.[0]
                || err.response?.data?.message
                || 'Failed to save profile.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not set';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const avatarSource = avatarUri
        ? { uri: avatarUri }
        : user?.avatar_url
        ? { uri: user.avatar_url }
        : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>

                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} activeOpacity={0.8}>
                            {avatarSource ? (
                                <Image source={avatarSource} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                        {staff?.employee_id && (
                            <Text style={styles.employeeId}>{staff.employee_id}</Text>
                        )}
                    </View>

                    {/* Contact info — phone is editable */}
                    <Text style={styles.sectionTitle}>Contact</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{user?.email}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <TextInput
                                style={styles.phoneInput}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. +21612345678"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                                maxLength={16}
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    {/* Work details — read-only */}
                    <Text style={styles.sectionTitle}>Work Details</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Employee ID</Text>
                            <Text style={styles.infoValue}>{staff?.employee_id || '—'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Hire Date</Text>
                            <Text style={styles.infoValue}>{formatDate(staff?.hire_date)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Region</Text>
                            <Text style={styles.infoValue}>{staff?.region?.name || 'Not assigned'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Address</Text>
                            <Text style={[styles.infoValue, styles.infoValueWrap]}>{staff?.address || 'Not set'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Role</Text>
                            <Text style={styles.infoValue}>Delivery Staff</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeText}>Active</Text>
                            </View>
                        </View>
                    </View>

                    {/* Rest days */}
                    {staff?.off_days && staff.off_days.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Rest Days</Text>
                            <View style={styles.offDaysRow}>
                                {staff.off_days.map((day: string) => (
                                    <View key={day} style={styles.dayBadge}>
                                        <Text style={styles.dayBadgeText}>{day.slice(0, 3).toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Save — only visible when changes exist */}
                    {hasChanges && (
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                        <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    avatarSection: { alignItems: 'center', marginVertical: 24 },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    cameraOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#111', borderRadius: 12, padding: 5,
        borderWidth: 2, borderColor: '#f5f7fb',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
    email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    employeeId: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' },

    sectionTitle: {
        fontSize: 12, fontWeight: '700', color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: 0.8,
        marginBottom: 8, marginTop: 4,
    },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    },
    infoLabel: { fontSize: 14, color: '#6b7280', flexShrink: 0 },
    infoValue: {
        fontSize: 14, color: '#111', fontWeight: '500',
        textAlign: 'right', flex: 1, marginLeft: 8,
    },
    infoValueWrap: { flexWrap: 'wrap' },
    phoneInput: {
        flex: 1, textAlign: 'right', fontSize: 14, color: '#111',
        fontWeight: '500', marginLeft: 8,
        borderBottomWidth: 1, borderBottomColor: '#2563eb', paddingVertical: 2,
    },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
    activeBadge: {
        backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
    },
    activeText: { color: '#065f46', fontSize: 12, fontWeight: '600' },
    offDaysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    dayBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    dayBadgeText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

    saveButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginBottom: 12,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#ef4444', padding: 16, borderRadius: 12, marginTop: 8,
    },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
