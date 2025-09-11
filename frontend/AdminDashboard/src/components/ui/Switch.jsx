import React from 'react';

const Switch = ({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2";
  const checkedClasses = checked ? "bg-primary-600" : "bg-gray-200";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const thumbClasses = "inline-block h-4 w-4 transform rounded-full bg-white transition-transform";
  const thumbCheckedClasses = checked ? "translate-x-6" : "translate-x-1";
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${baseClasses} ${checkedClasses} ${disabledClasses} ${className}`}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      {...props}
    >
      <span className={`${thumbClasses} ${thumbCheckedClasses}`} />
    </button>
  );
};

export { Switch };
export default Switch;
