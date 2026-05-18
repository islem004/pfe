import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (userId: number | string) => `unlocked_deliveries_${userId}`;

export async function getUnlockedIds(userId: number | string): Promise<Set<number>> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as number[]);
    } catch {
        return new Set();
    }
}

export async function unlockDelivery(userId: number | string, deliveryId: number): Promise<void> {
    try {
        const current = await getUnlockedIds(userId);
        current.add(deliveryId);
        await AsyncStorage.setItem(storageKey(userId), JSON.stringify([...current]));
    } catch {
        // silently fail — UI still works, delivery will just be locked again next session
    }
}
