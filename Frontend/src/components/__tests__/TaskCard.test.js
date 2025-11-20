import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';

const mockTask = {
    _id: '1',
    description: 'Test Task Description',
    pickupLocation: 'A',
    dropoffLocation: 'B',
    estimatedTime: 30,
    rewardAmount: 500,
    status: 'available',
    assignedTo: { firstName: 'John', lastName: 'Doe' }
};

describe('TaskCard', () => {
    it('renders task details correctly', () => {
        render(<TaskCard task={mockTask} />);
        expect(screen.getByText('Test Task Description')).toBeInTheDocument();
        expect(screen.getByText('KSh 500')).toBeInTheDocument();
        expect(screen.getByText('available')).toBeInTheDocument();
    });

    it('calls action button when clicked', () => {
        const mockAction = jest.fn();
        render(
            <TaskCard 
                task={mockTask} 
                onAction={mockAction} 
                actionLabel="Claim" 
            />
        );
        
        const button = screen.getByText('Claim');
        fireEvent.click(button);
        expect(mockAction).toHaveBeenCalledWith(mockTask);
    });
});