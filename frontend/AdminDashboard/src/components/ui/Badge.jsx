import React from 'react';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full transition-all duration-200';
  
  const variants = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    success: 'bg-success-100 text-success-800 border border-success-200',
    warning: 'bg-warning-100 text-warning-800 border border-warning-200',
    danger: 'bg-danger-100 text-danger-800 border border-danger-200',
    info: 'bg-info-100 text-info-800 border border-info-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    outline: 'bg-white border-2 border-primary-500 text-primary-600',
    solid: 'bg-primary-600 text-white shadow-sm',
  };
  
  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-sm',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
