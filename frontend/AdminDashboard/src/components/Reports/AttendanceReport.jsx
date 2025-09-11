import React from 'react';
import { Card } from '../ui';
import { Clock, Users, TrendingUp, TrendingDown } from 'lucide-react';

const AttendanceReport = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.reduce((acc, user) => acc + user.present_days, 0) || 0}
          </div>
          <div className="text-sm text-gray-600">Total Present Days</div>
        </div>
        <div className="text-center">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Total Employees</div>
        </div>
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.length ? 
              Math.round(data.users_summary.reduce((acc, user) => acc + user.attendance_rate, 0) / data.users_summary.length) : 0}%
          </div>
          <div className="text-sm text-gray-600">Average Attendance</div>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceReport;
