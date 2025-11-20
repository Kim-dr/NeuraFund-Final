import React, { useState } from 'react';
import { useToast } from './Toast';
import api from '../utils/api';

const ProofReview = ({ task, onSuccess, onCancel }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const handleReview = async (approved) => {
    setLoading(true);

    try {
      await api.put(`/tasks/${task._id}/review`, {
        approved,
        reviewNotes,
      });
      onSuccess();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const uploadsBaseUrl = apiBaseUrl.replace('/api', '');

  return (
    <div className="proof-review-container">
      <h3>Review Task Proof</h3>
      <div className="task-summary">
        <p><strong>Task:</strong> {task.description}</p>
        <p><strong>Student:</strong> {task.assignedTo?.firstName} {task.assignedTo?.lastName}</p>
        <p><strong>Reward:</strong> KSh {task.rewardAmount}</p>
      </div>
      <div className="proof-files">
        <h4>Submitted Proof:</h4>
        {task.proof && task.proof.length > 0 ? (
          <div className="proof-list">
            {task.proof.map((file, index) => (
              <div key={index} className="proof-item">
                {file.mimetype.startsWith('image/') ? (
                  <img
                    src={`${uploadsBaseUrl}/uploads/task-proofs/${file.filename}`}
                    alt={`Proof ${index + 1}`}
                    className="proof-image"
                  />
                ) : (
                  <a
                    href={`${uploadsBaseUrl}/uploads/task-proofs/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file.originalName}
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No proof files available</p>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="reviewNotes">Review Notes (Optional)</label>
        <textarea
          id="reviewNotes"
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          rows="3"
          placeholder="Add any comments or feedback..."
        />
      </div>
      <div className="form-actions">
        <button
          onClick={() => handleReview(true)}
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Approve & Pay'}
        </button>
        <button
          onClick={() => handleReview(false)}
          className="btn btn-danger"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Reject'}
        </button>
        <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProofReview;
