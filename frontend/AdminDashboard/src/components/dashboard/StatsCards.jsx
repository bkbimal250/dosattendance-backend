import React from 'react';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCards = ({ statCards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {statCards.map((stat, index) => (
        <Card key={index} className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer" hover>
          {/* Background gradient based on color */}
          <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 opacity-30`}></div>
          
          <Card.Body className="relative p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                  {stat.value}
                </p>
                
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full ${
                    stat.changeType === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold">
                      {stat.change}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">from last week</span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            
            {/* Decorative element */}
            <div className={`absolute bottom-0 right-0 w-12 h-12 bg-${stat.color}-200/20 rounded-full -translate-y-6 translate-x-6`}></div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
