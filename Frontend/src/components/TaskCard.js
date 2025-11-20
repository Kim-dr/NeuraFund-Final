import React from 'react';

const TaskCard = ({ task, onAction, actionLabel, showDetails = false }) => {
  const getStatusBadge = (status) => {
    const statusClasses = {
      available: 'status-available',
      'in-progress': 'status-progress',
      'pending-review': 'status-pending',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.description}</h3>
        {getStatusBadge(task.status)}
      </div>
      <div className="task-details">
        <div className="task-info">
          <span className="task-label">Pickup:</span>
          <span>{task.pickupLocation}</span>
        </div>
        <div className="task-info">
          <span className="task-label">Dropoff:</span>
          <span>{task.dropoffLocation}</span>
        </div>
        <div className="task-info">
          <span className="task-label">Time:</span>
          <span>{task.estimatedTime} minutes</span>
        </div>
        <div className="task-info">
          <span className="task-label">Reward:</span>
          <span className="task-reward">KSh {task.rewardAmount}</span>
        </div>
        {showDetails && task.assignedTo && (
          <div className="task-info">
            <span className="task-label">Assigned to:</span>
            <span>
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </span>
          </div>
        )}
      </div>
      {onAction && actionLabel && (
        <button onClick={() => onAction(task)} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default TaskCard;
