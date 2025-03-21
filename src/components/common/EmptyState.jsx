import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    {icon && (
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{description}</p>
    {onAction && (
      <Button onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

export default EmptyState;

