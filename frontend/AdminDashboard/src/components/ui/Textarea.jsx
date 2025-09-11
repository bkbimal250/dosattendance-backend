import React from 'react';

const Textarea = ({ 
  value, 
  onChange, 
  placeholder = '', 
  rows = 4,
  disabled = false,
  className = '', 
  ...props 
}) => {
  const baseClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
};

export { Textarea };
export default Textarea;
