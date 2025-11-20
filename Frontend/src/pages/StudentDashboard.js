import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import ProofUpload from '../components/ProofUpload';
import WalletManagement from '../components/WalletManagement';
import { RatingForm } from '../components/RatingSystem';
import StudentChatView from '../components/StudentChatView'; 
import { startTracking, stopTracking } from '../utils/tracking'; 

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  // 🎯 INITIAL DATA FETCH
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 🎯 UPDATED EFFECT: Stops tracking ONLY when Completed or Cancelled
  useEffect(() => {
    // 1. Find tasks that are truly "finished"
    const nonActiveTasks = myTasks.filter(
        task => 
            task.status === 'completed' || 
            task.status === 'cancelled'
    );

    // 2. Stop tracking if we have finished tasks (and no other active ones generally)
    if (nonActiveTasks.length > 0) {
        stopTracking(); 
    }
    
  }, [myTasks]); 
  
  // 🎯 UPDATED HELPER: Resumes tracking for In-Progress OR Pending-Review
  const checkAndResumeTracking = (tasksList) => {
      // Check for active task (including pending review)
      const activeTask = tasksList.find(
          task => task.status === 'in-progress' || task.status === 'pending-review'
      );
      
      if (activeTask) {
          startTracking(activeTask._id, user._id); 
      } else {
          stopTracking();
      }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [availableRes, myTasksRes] = await Promise.all([
        api.get('/tasks', { params: { status: 'available', ...filters } }),
        api.get('/tasks/my-tasks'),
      ]);
      
      const myTasksList = myTasksRes.data.data.tasks;

      setAvailableTasks(availableRes.data.data.tasks);
      setMyTasks(myTasksList);

      // 🔌 RESTART TRACKING FOR ACTIVE TASKS
      checkAndResumeTracking(myTasksList); 

    } catch (err) {
      showError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (task) => {
    try {
      await api.put(`/tasks/${task._id}/assign`);
      showSuccess('Task claimed successfully!');
      
      // 🔌 START LIVE TRACKING
      startTracking(task._id, user._id); 
      
      fetchTasks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to claim task');
    }
  };

  const handleUploadProof = (task) => {
    setSelectedTask(task);
    setShowProofUpload(true);
  };

  const handleProofSuccess = () => {
    setShowProofUpload(false);
    setSelectedTask(null);
    showSuccess('Proof uploaded successfully!');
    // ⚠️ NOTE: fetchTasks will run, putting the task in 'pending-review'.
    // Our new checkAndResumeTracking will keep the socket/tracking ALIVE.
    fetchTasks();
  };

  const handleRateVendor = (task) => {
    setSelectedTask(task);
    setShowRatingForm(true);
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    setSelectedTask(null);
    showSuccess('Rating submitted successfully!');
    fetchTasks();
  };

  const filteredAvailableTasks = availableTasks.filter((task) => {
    if (filters.location && !task.pickupLocation.toLowerCase().includes(filters.location.toLowerCase()) &&
        !task.dropoffLocation.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.minReward && task.rewardAmount < parseFloat(filters.minReward)) {
      return false;
    }
    if (filters.maxTime && task.estimatedTime > parseInt(filters.maxTime)) {
      return false;
    }
    return true;
  });

  if (showProofUpload && selectedTask) {
    return (
      <div className="dashboard-container">
        <ProofUpload
          task={selectedTask}
          onSuccess={handleProofSuccess}
          onCancel={() => setShowProofUpload(false)}
        />
      </div>
    );
  }

  if (showRatingForm && selectedTask) {
    return (
      <div className="dashboard-container">
        <RatingForm
          taskId={selectedTask._id}
          toUserId={selectedTask.createdBy._id || selectedTask.createdBy}
          onSuccess={handleRatingSuccess}
          onCancel={() => setShowRatingForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <p>Welcome, {user.firstName}!</p>
          <p className="wallet-balance">Wallet: KSh {user.walletBalance || 0}</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Tasks ({filteredAvailableTasks.length})
        </button>
        <button
          className={`tab ${activeTab === 'my-tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-tasks')}
        >
          My Tasks ({myTasks.length})
        </button>
        <button
          className={`tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="tasks-section">
          <TaskFilters filters={filters} onFilterChange={setFilters} />
          {loading ? (
            <div className="loading">Loading tasks...</div>
          ) : filteredAvailableTasks.length === 0 ? (
            <div className="no-tasks">No available tasks found</div>
          ) : (
            <div className="tasks-grid">
              {filteredAvailableTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onAction={handleClaimTask}
                  actionLabel="Claim Task"
                />
              ))}
              </div>
          )}
        </div>
      )}

      {activeTab === 'my-tasks' && (
        <div className="tasks-section">
          {loading ? (
            <div className="loading">Loading your tasks...</div>
          ) : myTasks.length === 0 ? (
            <div className="no-tasks">You have no active tasks</div>
          ) : (
            <div className="tasks-grid">
              {myTasks.map((task) => (
                <React.Fragment key={task._id}>
                  <TaskCard
                    key={task._id}
                    task={task}
                    onAction={
                      task.status === 'in-progress' 
                        ? handleUploadProof 
                        : task.status === 'completed' 
                        ? handleRateVendor 
                        : null
                    }
                    actionLabel={
                      task.status === 'in-progress' 
                        ? 'Submit Proof' 
                        : task.status === 'completed' 
                        ? 'Rate Vendor' 
                        : null
                    }
                    showDetails
                  />
                  
                  {/* 🎯 UPDATED: KEEP CHAT VISIBLE DURING PENDING REVIEW */}
                  {(task.status === 'in-progress' || task.status === 'pending-review') && (
                    <StudentChatView 
                        taskId={task._id}
                        userId={user._id}
                        taskDetails={task}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wallet' && <WalletManagement />}
    </div>
  );
};

export default StudentDashboard;