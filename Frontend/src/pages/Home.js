import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to NeuraFund</h1>
        <p className="hero-subtitle">
          Connecting campus students with local vendors for quick tasks and instant income
        </p>
        {!isAuthenticated ? (
          <div className="hero-actions">
            <Link to="/register/student" className="btn btn-primary btn-large">
              Join as Student
            </Link>
            <Link to="/register/vendor" className="btn btn-secondary btn-large">
              Join as Vendor
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link
              to={user.role === 'student' ? '/dashboard/student' : '/dashboard/vendor'}
              className="btn btn-primary btn-large"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>For Students</h3>
            <ul>
              <li>Browse available tasks near campus</li>
              <li>Choose tasks that fit your schedule</li>
              <li>Complete tasks and upload proof</li>
              <li>Get paid instantly to your wallet</li>
            </ul>
          </div>
          <div className="feature-card">
            <h3>For Vendors</h3>
            <ul>
              <li>Post tasks with clear requirements</li>
              <li>Students claim and complete tasks</li>
              <li>Review proof of completion</li>
              <li>Build trust through ratings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- DUMMY FOOTER FOR INTASEND VERIFICATION --- */}
      <footer style={{ marginTop: '4rem', borderTop: '1px solid #eee', padding: '2rem 0', textAlign: 'center', color: '#666' }}>
        <p>
          &copy; 2025 NeuraFund. All rights reserved.
          <br />
          <a href="#" style={{ color: '#3498db', textDecoration: 'none', margin: '0 10px' }}>Terms of Service</a>
          |
          <a href="#" style={{ color: '#3498db', textDecoration: 'none', margin: '0 10px' }}>Privacy Policy</a>
        </p>
      </footer>

    </div>
  );
};

export default Home;