export type DeliveryStatus =
    | 'pending'
    | 'confirmed'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'problem'
    | 'cancelled';

export interface Delivery {
    id: number;
    delivery_number: string;
    status: DeliveryStatus;
    delivery_address_text?: string;
    dest_city?: string;
    created_at: string;
    updated_at: string;
}

export interface StatusCount {
    status: DeliveryStatus;
    count: number;
    percentage: number;
}

export interface ActivityPoint {
    date: string;
    label: string;
    count: number;
}

export interface StaffStatistics {
    total: number;
    delivered: number;
    in_transit: number;
    pending: number;
    failed: number;
    picked_up: number;
    status_distribution: StatusCount[];
    weekly_activity: ActivityPoint[];
    recent_deliveries: Delivery[];
}
