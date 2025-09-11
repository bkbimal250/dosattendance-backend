import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary', className = '', text = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    success: 'border-green-600',
    warning: 'border-yellow-600',
    danger: 'border-red-600',
    white: 'border-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && (
        <p className="text-sm font-medium text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

const LoadingOverlay = ({ loading, children, text = 'Loading...', className = '' }) => {
  if (!loading) return children;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
};

const LoadingCard = ({ loading = true, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-100 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

const LoadingTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

LoadingSpinner.Overlay = LoadingOverlay;
LoadingSpinner.Card = LoadingCard;
LoadingSpinner.Table = LoadingTable;

export default LoadingSpinner;
