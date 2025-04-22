import React from 'react';

// Basic Card Component
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`rounded-lg shadow-md p-4 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header Component
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`border-b border-gray-200 pb-3 mb-3 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-xl font-semibold text-gray-800 ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Content Component
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// Basic Button Component
export const Button = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const baseStyles = 'rounded-md focus:outline-none transition-colors duration-200';
  
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent text-blue-500 hover:bg-blue-50'
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};