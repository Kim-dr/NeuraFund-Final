import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from '../TaskForm';

// Mock Toast
jest.mock('../Toast', () => ({
    useToast: () => ({ showError: jest.fn() })
}));

describe('TaskForm', () => {
    it('renders all input fields', () => {
        render(<TaskForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
        expect(screen.getByLabelText(/Task Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Pickup Location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Reward Amount/i)).toBeInTheDocument();
    });

    it('calls onSubmit with data', () => {
        const mockSubmit = jest.fn();
        render(<TaskForm onSubmit={mockSubmit} onCancel={jest.fn()} />);

        // Fill inputs (Using placeholder or Label regex)
        fireEvent.change(screen.getByLabelText(/Task Description/i), { target: { value: 'Deliver a parcel' } });
        fireEvent.change(screen.getByLabelText(/Pickup Location/i), { target: { value: 'Gate A' } });
        fireEvent.change(screen.getByLabelText(/Dropoff Location/i), { target: { value: 'Block B' } });
        fireEvent.change(screen.getByLabelText(/Estimated Time/i), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/Reward Amount/i), { target: { value: '500' } });

        // Submit
        fireEvent.click(screen.getByText('Create Task'));

        expect(mockSubmit).toHaveBeenCalled();
    });
});