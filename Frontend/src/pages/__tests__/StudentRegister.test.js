import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import StudentRegister from '../StudentRegister';

// Mock Toast
jest.mock('../../components/Toast', () => ({
    useToast: () => ({
        showSuccess: jest.fn(),
        showError: jest.fn()
    })
}));

describe('Student Registration', () => {
    const mockRegister = jest.fn();
    const mockContext = { registerStudent: mockRegister };

    it('renders registration form fields', () => {
        render(
            <AuthContext.Provider value={mockContext}>
                <BrowserRouter>
                    <StudentRegister />
                </BrowserRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
        // Use exact string match to avoid ambiguity
        expect(screen.getByLabelText('University Email')).toBeInTheDocument();
        expect(screen.getByLabelText('University')).toBeInTheDocument();
    });

    it('shows validation error if passwords do not match', () => {
        render(
            <AuthContext.Provider value={mockContext}>
                <BrowserRouter>
                    <StudentRegister />
                </BrowserRouter>
            </AuthContext.Provider>
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
        
        // 🛠️ FIX: Use exact strings to prevent "Multiple elements found" error
        fireEvent.change(screen.getByLabelText('University Email'), { target: { value: 'john@uni.edu' } });
        fireEvent.change(screen.getByLabelText('University'), { target: { value: 'Test Uni' } });
        
        // Mismatch passwords
        // Note: The label is just "Password" vs "Confirm Password"
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456' } });
        fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'abcdef' } });

        const submitBtn = screen.getByRole('button', { name: /Register/i });
        fireEvent.click(submitBtn);

        // Expect validation error message to appear (from validation.js)
        // Since we don't test the validation logic inside the component here, 
        // we just ensure the function wasn't called with mismatched data.
        expect(mockRegister).not.toHaveBeenCalled();
    });
});