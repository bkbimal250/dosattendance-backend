import React from 'react';
import { BarChart3, Users, TrendingUp } from 'lucide-react';

const ReportChart = ({ data, type }) => {
  if (!data) return null;

  const renderMonthlySummaryChart = () => {
    if (!data.employeeData || data.employeeData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No employee data available</p>
          </div>
        </div>
      );
    }

    // Get top 10 employees by attendance percentage for better visualization
    const topEmployees = [...data.employeeData]
      .sort((a, b) => b.attendance_percentage - a.attendance_percentage)
      .slice(0, 10);

    const maxPercentage = Math.max(...topEmployees.map(emp => emp.attendance_percentage));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Top 10 Employees by Attendance Rate</h4>
          <div className="text-xs text-gray-500">
            {topEmployees.length} employees shown
          </div>
        </div>
        
        <div className="h-48 space-y-2">
          {topEmployees.map((employee, index) => {
            const percentage = employee.attendance_percentage || 0;
            const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
            
            return (
              <div key={employee.user_id} className="flex items-center space-x-3">
                <div className="w-24 text-xs text-gray-600 truncate">
                  {employee.user_name}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
                <div className="w-12 text-xs text-gray-900 font-medium text-right">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center text-sm text-gray-600">
          Showing top performers from {data.employeeData.length} total employees
        </div>
      </div>
    );
  };

  const renderAttendanceChart = () => {
    if (!data.dailyStats || data.dailyStats.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No daily statistics available</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(
      ...data.dailyStats.map(day => Math.max(day.present, day.absent, day.late))
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Daily Attendance Breakdown</h4>
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
              <span>Late</span>
            </div>
          </div>
        </div>
        
        <div className="h-48 flex items-end space-x-1">
          {data.dailyStats.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              <div className="w-full flex space-x-1">
                <div 
                  className="bg-green-500 rounded-t"
                  style={{ 
                    height: `${(day.present / maxValue) * 120}px`,
                    flex: day.present || 1
                  }}
                ></div>
                <div 
                  className="bg-red-500 rounded-t"
                  style={{ 
                    height: `${(day.absent / maxValue) * 120}px`,
                    flex: day.absent || 1
                  }}
                ></div>
                <div 
                  className="bg-orange-500 rounded-t"
                  style={{ 
                    height: `${(day.late / maxValue) * 120}px`,
                    flex: day.late || 1
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(day.date).getDate()}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {data.dailyStats.length} days in period
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'monthly_summary':
        return renderMonthlySummaryChart();
      case 'attendance':
        return renderAttendanceChart();
      default:
        return (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Select a report type to view chart</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
};

export default ReportChart;
