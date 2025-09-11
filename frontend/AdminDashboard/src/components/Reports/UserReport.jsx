import React from 'react';
import { Card } from '../ui';
import { User, Clock, Calendar } from 'lucide-react';

const UserReport = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">User Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.reduce((acc, user) => acc + user.total_work_hours, 0) || 0}h
          </div>
          <div className="text-sm text-gray-600">Total Work Hours</div>
        </div>
        <div className="text-center">
          <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {data.users_summary?.reduce((acc, user) => acc + user.present_days, 0) || 0}
          </div>
          <div className="text-sm text-gray-600">Total Present Days</div>
        </div>
      </div>
    </Card>
  );
};

export default UserReport;
