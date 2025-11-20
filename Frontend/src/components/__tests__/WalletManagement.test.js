import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import WalletManagement from '../WalletManagement';

// Mock Toast & API
jest.mock('../../components/Toast', () => ({ showToast: jest.fn() }));
jest.mock('../../utils/api', () => ({
    get: jest.fn(() => Promise.resolve({ data: { data: { balance: 1000, transactions: [] } } })),
    post: jest.fn()
}));

describe('Wallet Management', () => {
    
    it('renders Deposit option for Vendor', async () => {
        const mockVendor = { role: 'vendor', firstName: 'Bob' };
        const mockContext = { 
            user: mockVendor, 
            refreshUser: jest.fn(), 
            updateUserBalance: jest.fn() 
        };

        render(
            <AuthContext.Provider value={mockContext}>
                <WalletManagement />
            </AuthContext.Provider>
        );

        // Should see Deposit
        expect(await screen.findByText(/Deposit Funds/i)).toBeInTheDocument();
        // Should NOT see Withdraw
        expect(screen.queryByText(/Withdraw to M-Pesa/i)).not.toBeInTheDocument();
    });

    it('renders Withdraw option for Student', async () => {
        const mockStudent = { role: 'student', firstName: 'Alice' };
        const mockContext = { 
            user: mockStudent, 
            refreshUser: jest.fn(), 
            updateUserBalance: jest.fn() 
        };

        render(
            <AuthContext.Provider value={mockContext}>
                <WalletManagement />
            </AuthContext.Provider>
        );

        // Should see Withdraw
        expect(await screen.findByText(/Withdraw to M-Pesa/i)).toBeInTheDocument();
    });
});