import React from 'react';
import {
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  FileText,
  Building2,
  Monitor
} from 'lucide-react';

const ReportCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      teal: 'bg-teal-50 text-teal-600',
      orange: 'bg-orange-50 text-orange-600',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIcon = (title) => {
    if (Icon) return Icon;

    // Default icons based on title
    const iconMap = {
      'Total Records': FileText,
      'Present': Users,
      'Absent': AlertCircle,
      'Attendance Rate': TrendingUp,
      'Total Leaves': Calendar,
      'Approved': TrendingUp,
      'Pending': Clock,
      'Approval Rate': TrendingUp,
      'Total Employees': Users,
      'Active Employees': Users,
      'Total Devices': Monitor,
      'Active Devices': Monitor,
    };

    return iconMap[title] || FileText;
  };

  const IconComponent = getIcon(title);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
