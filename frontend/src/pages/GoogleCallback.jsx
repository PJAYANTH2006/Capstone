import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userData = params.get('user');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Update axios default headers
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Update context
                setUser(user);

                // Success redirection
                navigate('/dashboard');
            } catch (err) {
                console.error('Error parsing user data:', err);
                navigate('/');
            }
        } else {
            navigate('/');
        }
    }, [location, navigate, setUser]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-xl font-medium">Completing login...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
