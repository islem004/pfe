import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app start, check if we have a saved token
    useEffect(() => {
        loadStoredToken();
    }, []);

    const loadStoredToken = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('staff_token');
            if (savedToken) {
                // Token exists — set it in axios headers
                api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
                setToken(savedToken);

                // Verify token is still valid by calling /staff/me
                const response = await api.get('/staff/me');
                setUser(response.data);
                console.log('Auto-login successful');
            }
        } catch (error) {
            // Token expired or invalid — clear it
            console.log('Saved token invalid, clearing');
            await AsyncStorage.removeItem('staff_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // POST to Laravel staff login
       const response = await api.post('/staff/login', { email, password });

        const { token: newToken, user: userData } = response.data;

        // Save token to phone storage (survives app restart)
        await AsyncStorage.setItem('staff_token', newToken);

        // Set token for all future API requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        setToken(newToken);
        setUser(userData);

        console.log('Login successful');
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/staff/logout');
        } catch (error) {
            console.log('Logout API error (ignoring):', error.message);
        }

        // Clear everything
        await AsyncStorage.removeItem('staff_token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        console.log('Logged out');
    };

    const updateUser = (userData) => setUser(userData);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);