import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          NeuraFund
        </Link>
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link
                to={user.role === 'student' ? '/dashboard/student' : '/dashboard/vendor'}
                className="navbar-link"
              >
                Dashboard
              </Link>
              <span className="navbar-user">
                {user.firstName} ({user.role})
              </span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register/student" className="navbar-link">
                Student Sign Up
              </Link>
              <Link to="/register/vendor" className="navbar-link">
                Vendor Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
