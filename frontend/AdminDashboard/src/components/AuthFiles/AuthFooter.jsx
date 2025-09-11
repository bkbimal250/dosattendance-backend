import React from 'react';

const AuthFooter = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <img 
                src="/companylogo.png" 
                alt="Disha Online Solution" 
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-white font-bold text-xs">DOS</div>
            </div>
            <span className="font-semibold text-white">Disha Online Solution</span>
          </div>
          <p className="text-sm">© 2024 Disha Online Solution. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-1">Professional Business Solutions</p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
