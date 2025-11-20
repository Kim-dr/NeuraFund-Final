import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Home from '../Home';

describe('Home Page', () => {
    it('renders welcome message for guest', () => {
        const mockContext = { isAuthenticated: false, user: null };
        render(
            <AuthContext.Provider value={mockContext}>
                <BrowserRouter><Home /></BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Welcome to NeuraFund/i)).toBeInTheDocument();
        expect(screen.getByText(/Join as Student/i)).toBeInTheDocument();
    });

    it('renders dashboard link for logged in user', () => {
        const mockContext = { 
            isAuthenticated: true, 
            user: { role: 'student' } 
        };
        render(
            <AuthContext.Provider value={mockContext}>
                <BrowserRouter><Home /></BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
    });
});