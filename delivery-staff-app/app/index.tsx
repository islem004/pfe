import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (token) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}