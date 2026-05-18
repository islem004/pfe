import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.17:8000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// AUTO-ATTACH TOKEN — but skip login requests
api.interceptors.request.use(async (config) => {
    if (config.url && config.url.includes('/login')) {
        delete config.headers.Authorization;
        console.log('[REQ]', config.method?.toUpperCase(), config.url, '(no token - login request)');
        return config;
    }

    try {
        const token = await AsyncStorage.getItem('staff_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // AsyncStorage failed, continue without token
    }

    console.log('[REQ]', config.method?.toUpperCase(), config.url);
    return config;
});

// LOG RESPONSES
api.interceptors.response.use(
    (response) => {
        console.log('[RES]', response.status, response.config.url);
        return response;
    },
    (error) => {
        if (error.response) {
            console.log('[ERR]', error.response.status, error.config?.url);
            console.log('   Data:', JSON.stringify(error.response.data));
        } else if (error.request) {
            console.log('[ERR] NETWORK ERROR - no response from server');
        } else {
            console.log('[ERR]', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;