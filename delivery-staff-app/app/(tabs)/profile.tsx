import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const staff = user?.staff;

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not set';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Avatar with initials */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </Text>
                        </View>
                        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                        {staff?.employee_id && (
                            <Text style={styles.employeeId}>{staff.employee_id}</Text>
                        )}
                    </View>

                    {/* Contact info */}
                    <Text style={styles.sectionTitle}>Contact</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📧 Email</Text>
                            <Text style={styles.infoValue}>{user?.email}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📱 Phone</Text>
                            <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
                        </View>
                    </View>

                    {/* Work details */}
                    <Text style={styles.sectionTitle}>Work Details</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>🆔 Employee ID</Text>
                            <Text style={styles.infoValue}>{staff?.employee_id || '—'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📅 Hire Date</Text>
                            <Text style={styles.infoValue}>{formatDate(staff?.hire_date)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📍 Region</Text>
                            <Text style={styles.infoValue}>{staff?.region?.name || 'Not assigned'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>🏠 Address</Text>
                            <Text style={[styles.infoValue, styles.infoValueWrap]}>{staff?.address || 'Not set'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>🔑 Role</Text>
                            <Text style={styles.infoValue}>Delivery Staff</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>✅ Status</Text>
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

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
    email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    employeeId: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' },

    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    infoLabel: { fontSize: 14, color: '#6b7280', flexShrink: 0 },
    infoValue: { fontSize: 14, color: '#111', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 8 },
    infoValueWrap: { flexWrap: 'wrap' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
    activeBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    activeText: { color: '#065f46', fontSize: 12, fontWeight: '600' },

    offDaysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    dayBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dayBadgeText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

    logoutButton: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});