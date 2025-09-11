import React from 'react';

const AuthHeader = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <img 
                src="/companylogo.png" 
                alt="Disha Online Solution" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-white font-bold text-sm">DOS</div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Disha Online Solution
              </h1>
              <p className="text-blue-100 text-sm">Professional Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
