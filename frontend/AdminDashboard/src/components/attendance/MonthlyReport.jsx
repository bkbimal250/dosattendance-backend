import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  Download, Calendar, Clock, User, 
  TrendingUp, BarChart3, FileText, 
  CheckCircle, XCircle, AlertCircle,
  AlertTriangle, Timer, CalendarDays
} from 'lucide-react';

const MonthlyReport = ({ employee, month, year, attendanceData }) => {
  const [monthlyStats, setMonthlyStats] = useState({});
  const [dailyBreakdown, setDailyBreakdown] = useState([]);

  useEffect(() => {
    calculateMonthlyStats();
  }, [employee, month, year, attendanceData]);

  const calculateMonthlyStats = () => {
    if (!employee || !attendanceData) return;

    const employeeData = attendanceData.filter(record => record.user?.id === employee.id);
    
    // Calculate daily breakdown
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const breakdown = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayData = employeeData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.getDate() === day;
      });

      const checkIn = dayData.find(record => record.status === 'IN');
      const checkOut = dayData.find(record => record.status === 'OUT');
      
      let status = 'absent';
      let dayStatus = 'absent';
      let workHours = 0;
      let isLate = false;
      let lateMinutes = 0;
      
      if (checkIn && checkOut) {
        status = 'present';
        workHours = (new Date(checkOut.timestamp) - new Date(checkIn.timestamp)) / (1000 * 60 * 60);
        
        // Determine day status based on work hours
        if (workHours >= 5) {
          dayStatus = 'complete_day';
        } else {
          dayStatus = 'half_day';
        }
        
        // Check if late coming (after 11:30 AM)
        const checkInTime = new Date(checkIn.timestamp);
        const lateThreshold = new Date(checkInTime);
        lateThreshold.setHours(11, 30, 0, 0);
        
        if (checkInTime > lateThreshold) {
          isLate = true;
          lateMinutes = Math.round((checkInTime - lateThreshold) / (1000 * 60));
        }
      } else if (checkIn) {
        status = 'partial';
        dayStatus = 'half_day';
        
        // Check if late coming for partial day
        const checkInTime = new Date(checkIn.timestamp);
        const lateThreshold = new Date(checkInTime);
        lateThreshold.setHours(11, 30, 0, 0);
        
        if (checkInTime > lateThreshold) {
          isLate = true;
          lateMinutes = Math.round((checkInTime - lateThreshold) / (1000 * 60));
        }
      }

      breakdown.push({
        date,
        day,
        status,
        dayStatus,
        checkIn: checkIn?.timestamp,
        checkOut: checkOut?.timestamp,
        workHours: Math.round(workHours * 100) / 100,
        isLate,
        lateMinutes
      });
    }

    // Calculate monthly statistics
    const presentDays = breakdown.filter(day => day.status === 'present').length;
    const partialDays = breakdown.filter(day => day.status === 'partial').length;
    const absentDays = daysInMonth - presentDays - partialDays; // Correct calculation
    const completeDays = breakdown.filter(day => day.dayStatus === 'complete_day').length;
    const halfDays = breakdown.filter(day => day.dayStatus === 'half_day').length;
    const lateDays = breakdown.filter(day => day.isLate).length;
    const totalWorkHours = breakdown.reduce((sum, day) => sum + day.workHours, 0);
    const averageWorkHours = presentDays > 0 ? totalWorkHours / presentDays : 0;
    const totalLateMinutes = breakdown.reduce((sum, day) => sum + (day.lateMinutes || 0), 0);

    setMonthlyStats({
      totalDays: daysInMonth,
      presentDays,
      partialDays,
      absentDays,
      completeDays,
      halfDays,
      lateDays,
      attendanceRate: (presentDays / daysInMonth) * 100,
      totalWorkHours,
      averageWorkHours,
      totalLateMinutes
    });

    setDailyBreakdown(breakdown);
  };

  const exportMonthlyReport = () => {
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const csvContent = [
      ['Employee Monthly Attendance Report'],
      [''],
      ['Employee Name', employee.username],
      ['Employee ID', employee.employee_id || 'N/A'],
      ['Department', employee.department?.name || 'N/A'],
      ['Month', `${monthName} ${year}`],
      [''],
      ['Date', 'Day', 'Status', 'Day Status', 'Check In', 'Check Out', 'Work Hours', 'Late Coming', 'Late Minutes'],
      ...dailyBreakdown.map(day => [
        day.date.toLocaleDateString(),
        day.date.toLocaleDateString('en-US', { weekday: 'short' }),
        day.status.toUpperCase(),
        day.dayStatus ? day.dayStatus.replace('_', ' ').toUpperCase() : 'N/A',
        day.checkIn ? new Date(day.checkIn).toLocaleTimeString() : 'N/A',
        day.checkOut ? new Date(day.checkOut).toLocaleTimeString() : 'N/A',
        day.workHours > 0 ? `${day.workHours}h` : 'N/A',
        day.isLate ? 'Yes' : 'No',
        day.lateMinutes > 0 ? `${day.lateMinutes} min` : 'N/A'
      ]),
      [''],
      ['Summary'],
      ['Total Days', monthlyStats.totalDays],
      ['Present Days', monthlyStats.presentDays],
      ['Partial Days', monthlyStats.partialDays],
      ['Absent Days', monthlyStats.absentDays],
      ['Complete Days', monthlyStats.completeDays],
      ['Half Days', monthlyStats.halfDays],
      ['Late Coming Days', monthlyStats.lateDays],
      ['Attendance Rate', `${Math.round(monthlyStats.attendanceRate)}%`],
      ['Total Work Hours', `${Math.round(monthlyStats.totalWorkHours)}h`],
      ['Average Work Hours', `${Math.round(monthlyStats.averageWorkHours)}h`],
      ['Total Late Minutes', `${monthlyStats.totalLateMinutes} min`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${employee.username}_${monthName}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayStatusColor = (dayStatus) => {
    switch (dayStatus) {
      case 'complete_day':
        return 'bg-green-100 text-green-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4" />;
      case 'absent':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!employee) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Monthly Report</h3>
          <p className="text-gray-600">
            {employee.username} • {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={exportMonthlyReport} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round(monthlyStats.attendanceRate || 0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-600">Present Days</p>
              <p className="text-2xl font-bold text-green-900">
                {monthlyStats.presentDays || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-600">Total Hours</p>
              <p className="text-2xl font-bold text-orange-900">
                {Math.round(monthlyStats.totalWorkHours || 0)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-purple-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(monthlyStats.averageWorkHours || 0)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-600">Complete Days</p>
              <p className="text-2xl font-bold text-green-900">
                {monthlyStats.completeDays || 0}
              </p>
              <p className="text-xs text-green-600">≥ 5 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Timer className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Half Days</p>
              <p className="text-2xl font-bold text-yellow-900">
                {monthlyStats.halfDays || 0}
              </p>
              <p className="text-xs text-yellow-600">< 5 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-600">Late Coming</p>
              <p className="text-2xl font-bold text-orange-900">
                {monthlyStats.lateDays || 0}
              </p>
              <p className="text-xs text-orange-600">After 11:30 AM</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-600">Absent Days</p>
              <p className="text-2xl font-bold text-red-900">
                {monthlyStats.absentDays || 0}
              </p>
              <p className="text-xs text-red-600">No check-in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h4>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {dailyBreakdown.map((day, index) => (
            <div key={index} className="text-center p-2 border rounded-lg">
              <div className="text-sm font-medium text-gray-900">{day.day}</div>
              <div className="mt-1">
                <Badge className={`text-xs ${getStatusColor(day.status)}`}>
                  {day.status.charAt(0).toUpperCase()}
                </Badge>
              </div>
              {day.dayStatus && day.dayStatus !== 'absent' && (
                <div className="mt-1">
                  <Badge className={`text-xs ${getDayStatusColor(day.dayStatus)}`}>
                    {day.dayStatus === 'complete_day' ? 'C' : 'H'}
                  </Badge>
                </div>
              )}
              {day.isLate && (
                <div className="mt-1">
                  <Badge className="text-xs bg-orange-100 text-orange-800">
                    L
                  </Badge>
                </div>
              )}
              {day.workHours > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {day.workHours}h
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Legend</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">P</Badge>
            <span>Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800">H</Badge>
            <span>Half Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-100 text-red-800">A</Badge>
            <span>Absent</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-orange-100 text-orange-800">L</Badge>
            <span>Late Coming</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyReport;
