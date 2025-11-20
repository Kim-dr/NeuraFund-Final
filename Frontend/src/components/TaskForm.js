import React, { useState } from 'react';
import { useToast } from './Toast';
import { validateTaskForm } from '../utils/validation';

const TaskForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    pickupLocation: '',
    dropoffLocation: '',
    estimatedTime: '',
    rewardAmount: '',
  });
  const [errors, setErrors] = useState({});
  const { showError } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateTaskForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      showError('Please fix the form errors');
      return;
    }

    onSubmit({
      ...formData,
      estimatedTime: parseInt(formData.estimatedTime),
      rewardAmount: parseFloat(formData.rewardAmount),
    });
  };

  return (
    <div className="task-form-container">
      <h3>Create New Task</h3>
      <form onSubmit={handleSubmit} className="task-form">
        <div className={`form-group ${errors.description ? 'error' : ''}`}>
          <label htmlFor="description">Task Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Describe the task in detail (minimum 10 characters)"
            required
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>
        <div className={`form-group ${errors.pickupLocation ? 'error' : ''}`}>
          <label htmlFor="pickupLocation">Pickup Location *</label>
          <input
            type="text"
            id="pickupLocation"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleChange}
            placeholder="e.g., Main Campus Library"
            required
          />
          {errors.pickupLocation && <span className="form-error">{errors.pickupLocation}</span>}
        </div>
        <div className={`form-group ${errors.dropoffLocation ? 'error' : ''}`}>
          <label htmlFor="dropoffLocation">Dropoff Location *</label>
          <input
            type="text"
            id="dropoffLocation"
            name="dropoffLocation"
            value={formData.dropoffLocation}
            onChange={handleChange}
            placeholder="e.g., Student Center"
            required
          />
          {errors.dropoffLocation && <span className="form-error">{errors.dropoffLocation}</span>}
        </div>
        <div className="form-row">
          <div className={`form-group ${errors.estimatedTime ? 'error' : ''}`}>
            <label htmlFor="estimatedTime">Estimated Time (minutes) *</label>
            <input
              type="number"
              id="estimatedTime"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleChange}
              min="1"
              max="480"
              placeholder="e.g., 30"
              required
            />
            {errors.estimatedTime && <span className="form-error">{errors.estimatedTime}</span>}
          </div>
          <div className={`form-group ${errors.rewardAmount ? 'error' : ''}`}>
            <label htmlFor="rewardAmount">Reward Amount (KSh) *</label>
            <input
              type="number"
              id="rewardAmount"
              name="rewardAmount"
              value={formData.rewardAmount}
              onChange={handleChange}
              min="1"
              step="0.01"
              placeholder="e.g., 500"
              required
            />
            {errors.rewardAmount && <span className="form-error">{errors.rewardAmount}</span>}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Create Task
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
