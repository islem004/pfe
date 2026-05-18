import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
    Deliveries:    { active: 'cube',          inactive: 'cube-outline' },
    Scan:          { active: 'scan',          inactive: 'scan-outline' },
    Notifications: { active: 'notifications', inactive: 'notifications-outline' },
    Profile:       { active: 'person',        inactive: 'person-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
    const icons = TAB_ICONS[name];
    const iconName = (focused ? icons?.active : icons?.inactive) ?? 'cube-outline';
    return <Ionicons name={iconName as any} size={24} color={color} />;
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 88,
                    paddingBottom: 30,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Deliveries',
                    tabBarIcon: ({ focused, color }) => <TabIcon name="Deliveries" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ focused, color }) => <TabIcon name="Scan" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    tabBarIcon: ({ focused, color }) => <TabIcon name="Notifications" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => <TabIcon name="Profile" focused={focused} color={color} />,
                }}
            />
        </Tabs>
    );
}
