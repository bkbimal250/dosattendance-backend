import React from 'react';
import { CheckCircle, Clock, XCircle, X, FileX, TrendingUp, Users } from 'lucide-react';

const ResignationStats = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total Resignations',
      value: stats?.total || 0,
      icon: FileX,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      change: stats?.total_change || 0,
      changeType: 'total'
    },
    {
      title: 'Pending Requests',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      change: stats?.pending_change || 0,
      changeType: 'pending'
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      change: stats?.approved_change || 0,
      changeType: 'approved'
    },
    {
      title: 'Rejected',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      change: stats?.rejected_change || 0,
      changeType: 'rejected'
    }
  ];

  const getChangeIcon = (change, changeType) => {
    if (change === 0) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    // For pending and rejected, increase is negative
    // For approved, increase is positive
    if (changeType === 'pending' || changeType === 'rejected') {
      return isPositive ? (
        <TrendingUp className="h-4 w-4 text-red-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
      );
    } else {
      return isPositive ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      );
    }
  };

  const getChangeColor = (change, changeType) => {
    if (change === 0) return 'text-gray-500';
    
    const isPositive = change > 0;
    
    // For pending and rejected, increase is negative
    // For approved, increase is positive
    if (changeType === 'pending' || changeType === 'rejected') {
      return isPositive ? 'text-red-500' : 'text-green-500';
    } else {
      return isPositive ? 'text-green-500' : 'text-red-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className={`bg-white rounded-xl shadow-sm border ${item.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
                <p className={`text-3xl font-bold ${item.color} mb-2`}>{item.value}</p>
                
                {/* Change indicator */}
                {item.change !== 0 && (
                  <div className="flex items-center space-x-1">
                    {getChangeIcon(item.change, item.changeType)}
                    <span className={`text-sm font-medium ${getChangeColor(item.change, item.changeType)}`}>
                      {Math.abs(item.change)} from last month
                    </span>
                  </div>
                )}
                
                {item.change === 0 && (
                  <p className="text-sm text-gray-500">No change from last month</p>
                )}
              </div>
              
              <div className={`${item.bgColor} p-3 rounded-xl`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResignationStats;
