import React from 'react';

const Button = ({ 
  variant = "primary", 
  icon, 
  children, 
  className = "",
  fullWidth = false,
  isLoading = false,
  ...props 
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    outline: "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
  };
  
  return (
    <button 
      className={`px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-200 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
      ) : icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;