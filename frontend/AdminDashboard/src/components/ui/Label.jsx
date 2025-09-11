import React from 'react';

const Label = ({ children, className = '', htmlFor, required = false, ...props }) => {
  const baseClasses = "block text-sm font-medium text-gray-700 mb-1";
  const requiredClasses = required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : "";
  
  return (
    <label 
      htmlFor={htmlFor} 
      className={`${baseClasses} ${requiredClasses} ${className}`} 
      {...props}
    >
      {children}
    </label>
  );
};

export { Label };
export default Label;
