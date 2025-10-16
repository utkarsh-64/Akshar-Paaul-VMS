// Enhanced error handling utility
export const handleApiError = (error, showError, defaultMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        showError(data.error || 'Invalid request. Please check your input.');
        break;
      case 401:
        showError('Authentication required. Please log in again.');
        // Could redirect to login here
        break;
      case 403:
        showError(data.error || 'Access denied. You do not have permission to perform this action.');
        break;
      case 404:
        showError('The requested resource was not found.');
        break;
      case 409:
        showError(data.error || 'Conflict. The resource already exists or is in use.');
        break;
      case 422:
        showError(data.error || 'Validation failed. Please check your input.');
        break;
      case 500:
        showError('Server error. Please try again later.');
        break;
      default:
        showError(data.error || defaultMessage);
    }
  } else if (error.request) {
    // Network error
    showError('Network error. Please check your connection and try again.');
  } else {
    // Other error
    showError(error.message || defaultMessage);
  }
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }
    
    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      return;
    }
    
    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be no more than ${rule.maxLength} characters`;
      return;
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${rule.label || field} format is invalid`;
      return;
    }
    
    if (value && rule.min && parseFloat(value) < rule.min) {
      errors[field] = `${rule.label || field} must be at least ${rule.min}`;
      return;
    }
    
    if (value && rule.max && parseFloat(value) > rule.max) {
      errors[field] = `${rule.label || field} must be no more than ${rule.max}`;
      return;
    }
    
    if (rule.custom && typeof rule.custom === 'function') {
      const customError = rule.custom(value, data);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  return 'An unexpected error occurred';
};

export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};