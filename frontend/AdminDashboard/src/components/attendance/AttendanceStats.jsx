import React from 'react';
import { Card } from '../ui';
import { 
  Clock, Calendar, UserCheck, UserX, 
  TrendingUp, Users, BarChart3, FileText,
  AlertTriangle, CalendarDays, Timer
} from 'lucide-react';

const AttendanceStats = ({ stats }) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Records</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.totalRecords || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All attendance entries
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Today's Records</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.todayRecords || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Clock in/out today
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UserCheck className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Present Employees</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.presentEmployees || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercentage(stats.presentEmployees || 0, stats.totalEmployees || 1)} of total
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Check Ins/Outs</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.checkIns || 0)} / {formatNumber(stats.checkOuts || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              In / Out ratio
            </p>
          </div>
        </div>
      </Card>

      {/* New Statistics Cards */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CalendarDays className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Complete Days</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.complete_day_records || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ≥ 5 hours worked
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Timer className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Half Days</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.half_day_records || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              < 5 hours worked
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Late Coming</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.late_coming_records || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              After 11:30 AM
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UserX className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Absent</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(stats.absent_records || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No check-in today
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceStats;
