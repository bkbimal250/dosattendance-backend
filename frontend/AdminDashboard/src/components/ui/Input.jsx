import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const baseInputClasses = "w-full px-4 py-3 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-400";
  const normalClasses = "border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-gray-300";
  const errorClasses = "border-danger-300 focus:border-danger-500 focus:ring-danger-500/20 bg-danger-50/30";
  
  const inputClasses = `${baseInputClasses} ${error ? errorClasses : normalClasses} ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="text-gray-400 w-4 h-4">{leftIcon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <span className="text-gray-400 w-4 h-4">{rightIcon}</span>
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-2 text-sm ${error ? 'text-danger-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;
