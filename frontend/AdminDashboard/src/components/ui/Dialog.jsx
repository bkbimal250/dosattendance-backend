import React, { useEffect } from 'react';

const Dialog = ({ 
  open, 
  onOpenChange, 
  children, 
  className = '', 
  ...props 
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => onOpenChange?.(false)}
      />
      <div className={`relative z-10 w-full max-w-full ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-xl w-full max-h-[95vh] overflow-y-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = '', ...props }) => {
  return (
    <h2 className={`text-base font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h2>
  );
};

const DialogBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-4 py-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

const DialogFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter };
export default Dialog;
