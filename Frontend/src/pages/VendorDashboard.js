import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import ProofReview from '../components/ProofReview';
import WalletManagement from '../components/WalletManagement';
import { RatingForm } from '../components/RatingSystem';
// 🔌 NEW IMPORT FOR LIVE TRACKING COMPONENT
import TaskLiveView from '../components/TaskLiveView'; 

const VendorDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProofReview, setShowProofReview] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [activeView, setActiveView] = useState('tasks');

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/my-tasks');
      setTasks(response.data.data.tasks);
    } catch (err) {
      showError('Failed to load tasks');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await api.post('/tasks', taskData);
      showSuccess('Task created successfully!');
      setShowTaskForm(false);
      fetchTasks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleReviewProof = (task) => {
    setSelectedTask(task);
    setShowProofReview(true);
  };

  const handleReviewSuccess = () => {
    setShowProofReview(false);
    setSelectedTask(null);
    showSuccess('Review submitted successfully!');
    fetchTasks();
  };

  const handleRateStudent = (task) => {
    setSelectedTask(task);
    setShowRatingForm(true);
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    setSelectedTask(null);
    showSuccess('Rating submitted successfully!');
    fetchTasks();
  };

  // 🛠️ NEW FUNCTION TO VIEW LIVE TRACKING
  const handleViewLive = (task) => {
    setSelectedTask(task);
    setActiveView('live'); // Set the active view to our new component
  };
  // ------------------------------------

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  // 1. CONDITIONAL RENDERING BLOCK MODIFIED
  if (showTaskForm) {
    return (
      <div className="dashboard-container">
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      </div>
    );
  }
  // 1A. SHOW LIVE VIEW WHEN ACTIVE VIEW IS 'LIVE'
  if (activeView === 'live' && selectedTask) {
    return (
        <div className="dashboard-container">
            <button onClick={() => setActiveView('tasks')} className="btn btn-secondary" style={{marginBottom: '15px'}}>
                &larr; Back to Tasks
            </button>
            <TaskLiveView
                taskId={selectedTask._id}
                taskCreatorId={user._id} // Pass the vendor's ID
            />
        </div>
    );
  }

  if (showProofReview && selectedTask) {
    return (
      <div className="dashboard-container">
        <ProofReview
          task={selectedTask}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowProofReview(false)}
        />
      </div>
    );
  }

  if (showRatingForm && selectedTask) {
    return (
      <div className="dashboard-container">
        <RatingForm
          taskId={selectedTask._id}
          toUserId={selectedTask.assignedTo._id || selectedTask.assignedTo}
          onSuccess={handleRatingSuccess}
          onCancel={() => setShowRatingForm(false)}
        />
        </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Vendor Dashboard</h1>
        <div className="user-info">
          <p>Welcome, {user.firstName}!</p>
          <p className="wallet-balance">Wallet: KSh {user.walletBalance || 0}</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeView === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveView('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab ${activeView === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveView('wallet')}
        >
          Wallet
        </button>
      </div>

      {activeView === 'wallet' ? (
        <WalletManagement />
      ) : (
        <>
          <div className="dashboard-actions">
            <button onClick={() => setShowTaskForm(true)} className="btn btn-primary">
              Create New Task
            </button>
          </div>

          <div className="tasks-section">
            <h2>Pending Review ({getTasksByStatus('pending-review').length})</h2>
            {getTasksByStatus('pending-review').length === 0 ? (
              <div className="no-tasks">No tasks pending review</div>
            ) : (
              <div className="tasks-grid">
                {getTasksByStatus('pending-review').map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onAction={handleReviewProof}
                    actionLabel="Review Proof"
                    showDetails
                  />
                ))}
              </div>
            )}
          </div>

          <div className="tasks-section">
            <h2>In Progress ({getTasksByStatus('in-progress').length})</h2>
            {getTasksByStatus('in-progress').length === 0 ? (
              <div className="no-tasks">No tasks in progress</div>
            ) : (
              <div className="tasks-grid">
                {/* 2. ADD LIVE VIEW BUTTON AND CONDITIONAL TASK CARD */}
                {getTasksByStatus('in-progress').map((task) => (
                  <TaskCard 
                        key={task._id} 
                        task={task} 
                        showDetails
                        onAction={handleViewLive} // ⬅️ NEW ACTION
                        actionLabel="View Live / Chat" // ⬅️ NEW LABEL
                    />
                ))}
              </div>
            )}
          </div>

          <div className="tasks-section">
            <h2>Available ({getTasksByStatus('available').length})</h2>
            {getTasksByStatus('available').length === 0 ? (
              <div className="no-tasks">No available tasks</div>
            ) : (
              <div className="tasks-grid">
                {getTasksByStatus('available').map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>

          <div className="tasks-section">
            <h2>Completed ({getTasksByStatus('completed').length})</h2>
            {getTasksByStatus('completed').length === 0 ? (
              <div className="no-tasks">No completed tasks</div>
            ) : (
              <div className="tasks-grid">
                {getTasksByStatus('completed').map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onAction={handleRateStudent}
                    actionLabel="Rate Student"
                    showDetails
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorDashboard;