import React, { useState } from 'react';
import { useToast } from './Toast';
import api from '../utils/api';

const ProofUpload = ({ task, onSuccess, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { showError } = useToast();

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      showError('Please select at least one file');
      return;
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      showError('Some files are too large. Maximum size is 5MB per file.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('proofFiles', file);
      });

      await api.put(`/tasks/${task._id}/submit-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="proof-upload-container">
      <h3>Submit Task Proof</h3>
      <div className="task-summary">
        <p><strong>Task:</strong> {task.description}</p>
        <p><strong>Reward:</strong> KSh {task.rewardAmount}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="proof">Upload Proof (Photos/Documents)</label>
          <input
            type="file"
            id="proof"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf"
            required
          />
          <small>Maximum file size: 5MB per file. Accepted formats: Images, PDF</small>
          {selectedFiles.length > 0 && (
            <div className="file-list">
              <p>Selected files ({selectedFiles.length}):</p>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Submit Proof'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={uploading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProofUpload;
