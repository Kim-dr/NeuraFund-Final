// Form validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (!value) return `${fieldName} is required`;
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (min !== null && num < min) return `${fieldName} must be at least ${min}`;
  if (max !== null && num > max) return `${fieldName} must be at most ${max}`;
  return null;
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^254\d{9}$/;
  if (!phone) return 'Phone number is required';
  if (!phoneRegex.test(phone)) return 'Invalid phone number format (254XXXXXXXXX)';
  return null;
};

export const validateUniversityEmail = (email) => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;
  
  // Check for common university email patterns
  const universityDomains = ['.edu', '.ac.'];
  const hasUniversityDomain = universityDomains.some(domain => email.includes(domain));
  
  if (!hasUniversityDomain) {
    return 'Please use a valid university email address';
  }
  return null;
};

export const validateTaskForm = (formData) => {
  const errors = {};
  
  if (!formData.description || formData.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  if (!formData.pickupLocation || formData.pickupLocation.trim() === '') {
    errors.pickupLocation = 'Pickup location is required';
  }
  
  if (!formData.dropoffLocation || formData.dropoffLocation.trim() === '') {
    errors.dropoffLocation = 'Dropoff location is required';
  }
  
  const timeError = validateNumber(formData.estimatedTime, 'Estimated time', 1, 480);
  if (timeError) errors.estimatedTime = timeError;
  
  const rewardError = validateNumber(formData.rewardAmount, 'Reward amount', 1);
  if (rewardError) errors.rewardAmount = rewardError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateRegistrationForm = (formData, role) => {
  const errors = {};
  
  const emailError = role === 'student' 
    ? validateUniversityEmail(formData.email)
    : validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  const firstNameError = validateRequired(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateRequired(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  if (role === 'student') {
    const universityError = validateRequired(formData.university, 'University');
    if (universityError) errors.university = universityError;
  }
  
  if (role === 'vendor') {
    const businessNameError = validateRequired(formData.businessName, 'Business name');
    if (businessNameError) errors.businessName = businessNameError;
    
    const locationError = validateRequired(formData.businessLocation, 'Business location');
    if (locationError) errors.businessLocation = locationError;
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

const validationUtils = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateNumber,
  validatePhoneNumber,
  validateUniversityEmail,
  validateTaskForm,
  validateRegistrationForm,
};

export default validationUtils;
