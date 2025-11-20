import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { validateRegistrationForm } from '../utils/validation';

const StudentRegister = () => {
  // 1. Added profilePic to state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    university: '',
    studentId: '',
    profilePic: null // <--- NEW
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { registerStudent } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    // 2. Destructure 'files' from event target
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      // Check if it is a file input, otherwise use the text value
      [name]: files ? files[0] : value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegistrationForm(formData, 'student');
    if (validationErrors) {
      setErrors(validationErrors);
      showError('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      // 3. CREATE FORM DATA (Required for file uploads)
      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('university', formData.university);
      if (formData.studentId) data.append('studentId', formData.studentId);
      
      // Append profile pic if it exists
      if (formData.profilePic) {
        data.append('profilePic', formData.profilePic);
      }

      // Pass 'data' object which is now FormData
      await registerStudent(data);
      
      showSuccess('Registration successful! Welcome to NeuraFund!');
      navigate('/dashboard/student');
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Student Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className={`form-group ${errors.firstName ? 'error' : ''}`}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className={`form-group ${errors.lastName ? 'error' : ''}`}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>
          <div className={`form-group ${errors.email ? 'error' : ''}`}>
            <label htmlFor="email">University Email</label>
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
          <div className={`form-group ${errors.university ? 'error' : ''}`}>
            <label htmlFor="university">University</label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              required
            />
            {errors.university && <span className="form-error">{errors.university}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="studentId">Student ID (Optional)</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
            />
          </div>

          {/* 4. NEW PROFILE PIC INPUT */}
          <div className="form-group">
            <label htmlFor="profilePic">Profile Picture (Optional)</label>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              accept="image/*"
              onChange={handleChange}
            />
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
          <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;