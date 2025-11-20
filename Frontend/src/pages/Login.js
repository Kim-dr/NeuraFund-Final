import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // This goes right after all your other hooks
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      showSuccess('Email verified successfully! You can now log in.');
    } else if (verified === 'false') {
      showError('Email verification failed. The link may be invalid or expired.');
    }
  }, [searchParams, showSuccess, showError]);

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

  const validateForm = () => {
    const newErrors = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the form errors');
      return;
    }
    
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      showSuccess(`Welcome back, ${user.firstName}!`);
      // Check for verification first!
      if (!user.isEmailVerified) {
        navigate('/please-verify');
      }
      // If verified, THEN redirect based on role
      else if (user.role === 'student') {
        navigate('/dashboard/student');
      } else {
        navigate('/dashboard/vendor');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to NeuraFund</h2>
        <form onSubmit={handleSubmit}>
          <div className={`form-group ${errors.email ? 'error' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className={`form-group ${errors.password ? 'error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <Link to="/register/student">Register as Student</Link> or{' '}
            <Link to="/register/vendor">Register as Vendor</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
