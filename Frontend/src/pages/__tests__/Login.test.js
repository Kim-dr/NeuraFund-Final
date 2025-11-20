import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // Import Context
import Login from '../Login';

// Mock the Toast
jest.mock('../../components/Toast', () => ({
    useToast: () => ({
        showSuccess: jest.fn(),
        showError: jest.fn()
    })
}));

// Mock API
jest.mock('../../utils/api', () => ({
    post: jest.fn()
}));

describe('Login Page', () => {
    // Mock Auth Values
    const mockLogin = jest.fn();
    const mockContextValue = {
        login: mockLogin,
        isAuthenticated: false
    };

    it('renders login form correctly', () => {
        render(
            <AuthContext.Provider value={mockContextValue}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByRole('heading', { name: /Login to NeuraFund/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('allows user to type credentials', () => {
        render(
            <AuthContext.Provider value={mockContextValue}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </AuthContext.Provider>
        );

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);

        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@test.com');
        expect(passwordInput.value).toBe('password123');
    });
});