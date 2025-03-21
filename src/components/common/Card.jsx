import React from 'react';

const Card = ({ 
  title, 
  icon, 
  description, 
  actionText, 
  onAction,
  className = "" 
}) => {
  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center mb-3">
        {icon && (
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
        <h3 className="ml-2 font-medium text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
      )}
      {onAction && (
        <button 
          onClick={onAction} 
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center"
        >
          {actionText}
          <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Card;

