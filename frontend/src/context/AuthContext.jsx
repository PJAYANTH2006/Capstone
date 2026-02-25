import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set Base URL for axios if deployment URL is provided
    if (import.meta.env.VITE_API_URL) {
        axios.defaults.baseURL = import.meta.env.VITE_API_URL;
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (token && savedUser) {
            setUser(savedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const res = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data.user);
            console.log('Login successful:', res.data.user);
            return res.data;
        } catch (error) {
            console.error('Login error details:', error.response?.data || error.message);
            throw error;
        }
    };

    const register = async (username, email, password) => {
        try {
            console.log('Attempting registration for:', email);
            const res = await axios.post('/api/auth/register', { username, email, password });
            console.log('Registration successful:', res.data.message);
        } catch (error) {
            console.error('Registration error details:', error.response?.data || error.message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
