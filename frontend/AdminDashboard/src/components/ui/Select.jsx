import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ 
  value, 
  onValueChange, 
  children, 
  placeholder = "Select an option",
  disabled = false,
  className = '', 
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedChild = React.Children.toArray(children).find(
    child => child.props.value === value
  );

  const handleItemClick = (itemValue) => {
    onValueChange?.(itemValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef} {...props}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={selectedChild ? "text-gray-900" : "text-gray-500"}>
          {selectedChild ? selectedChild.props.children : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child, {
                onItemClick: handleItemClick
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

const SelectContent = ({ children, className = '', onItemClick, ...props }) => {
  return (
    <div className={`py-1 ${className}`} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onClick: () => onItemClick?.(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectItem = ({ value, children, className = '', onClick, ...props }) => {
  return (
    <div
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

const SelectValue = ({ placeholder, className = '', ...props }) => {
  return (
    <span className={`${className}`} {...props}>
      {placeholder}
    </span>
  );
};

Select.Content = SelectContent;
Select.Item = SelectItem;
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
export default Select;
