import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  Activity,
  FileText,
  PieChart,
  LineChart,
  Settings,
  Eye,
  Filter,
  AlertCircle,
  Building2,
  Monitor
} from 'lucide-react';
import { reportsAPI, officesAPI, usersAPI } from '../../services/api';
import ReportFilters from './ReportFilters';
import ReportCard from './ReportCard';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import ReportExport from './ReportExport';

const ReportsDashboard = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch offices and users for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [officesResponse, usersResponse] = await Promise.all([
          officesAPI.getOffices(),
          usersAPI.getUsers()
        ]);
        
        // Ensure we have arrays and handle potential API response issues
        const officesData = Array.isArray(officesResponse?.data?.results) ? officesResponse.data.results : 
                           Array.isArray(officesResponse?.data) ? officesResponse.data : [];
        const usersData = Array.isArray(usersResponse?.data?.results) ? usersResponse.data.results : 
                         Array.isArray(usersResponse?.data) ? usersResponse.data : [];
        
        setOffices(officesData);
        setUsers(usersData);
        
        console.log('✅ Filter data loaded:', { offices: officesData.length, users: usersData.length });
      } catch (error) {
        console.error('❌ Error fetching filter data:', error);
        // Set empty arrays on error to prevent crashes
        setOffices([]);
        setUsers([]);
      }
    };
    fetchFilterData();
  }, []);

  // Auto-generate report when filters change
  useEffect(() => {
    if (offices.length > 0) { // Only generate after offices are loaded
      generateMonthlySummary();
    }
  }, [selectedYear, selectedMonth, selectedOffice, selectedUser, offices.length]);

  const generateMonthlySummary = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const params = {
        year: selectedYear,
        month: selectedMonth
      };
      
      if (selectedOffice) {
        params.office = selectedOffice;
        console.log('🏢 Office filter applied:', selectedOffice, offices.find(o => o.id === selectedOffice)?.name);
      }
      
      if (selectedUser) {
        params.user = selectedUser;
        console.log('👤 User filter applied:', selectedUser, users.find(u => u.id === selectedUser)?.first_name);
      }
      
      console.log('🔄 Generating monthly summary for:', params);
      console.log('📊 Available offices:', offices.map(o => ({ id: o.id, name: o.name })));
      console.log('👥 Available users count:', users.length);
      const response = await reportsAPI.getMonthlySummary(params);
      
      console.log('✅ Monthly summary generated:', response.data);
      setMonthlySummary(response.data);
    } catch (error) {
      console.error('❌ Error generating monthly summary:', error);
      setError('Failed to generate monthly summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = () => {
    generateMonthlySummary();
  };

  const handleResetFilters = () => {
    setSelectedOffice('');
    setSelectedUser('');
  };

  const getCurrentReportData = () => {
    return monthlySummary;
  };

  const getCurrentReportSummary = () => {
    return monthlySummary?.summary;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Reports</h1>
          <p className="text-gray-600 mt-2">Generate monthly attendance summaries for your organization</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleGenerateReport}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedOffice={selectedOffice}
        selectedUser={selectedUser}
        offices={offices}
        users={users}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onOfficeChange={setSelectedOffice}
        onUserChange={setSelectedUser}
        onReset={handleResetFilters}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="space-y-6">
        {/* Summary Cards */}
        {getCurrentReportSummary() && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReportCard
              title="Total Employees"
              value={monthlySummary.summary.totalEmployees}
              icon={Users}
              color="blue"
            />
            <ReportCard
              title="Total Present Days"
              value={monthlySummary.summary.totalPresentDays}
              icon={TrendingUp}
              color="green"
            />
            <ReportCard
              title="Total Absent Days"
              value={monthlySummary.summary.totalAbsentDays}
              icon={AlertCircle}
              color="red"
            />
            <ReportCard
              title="Average Attendance Rate"
              value={`${monthlySummary.summary.averageAttendanceRate}%`}
              icon={BarChart3}
              color="purple"
            />
          </div>
        )}

        {/* Period Info */}
        {monthlySummary?.period && (
          <Card className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {months[monthlySummary.period.month - 1]} {monthlySummary.period.year}
              </h3>
              <p className="text-gray-600">
                {monthlySummary.period.start_date} to {monthlySummary.period.end_date} 
                ({monthlySummary.period.total_days} working days)
              </p>
            </div>
          </Card>
        )}

        {/* Report Data */}
        {getCurrentReportData() && (
          <div className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
                <ReportChart data={getCurrentReportData()} type="monthly_summary" />
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  {monthlySummary?.summary && (
                    <div className="text-sm text-gray-600">
                      <p>Total Hours: {monthlySummary.summary.totalHours}h</p>
                      <p>Total Late Days: {monthlySummary.summary.totalLateDays}</p>
                      <p>Average Rate: {monthlySummary.summary.averageAttendanceRate}%</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Data Table */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Employee Attendance Summary</h3>
                <ReportExport data={getCurrentReportData()} type="monthly_summary" />
              </div>
              <ReportTable data={getCurrentReportData()} type="monthly_summary" />
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!getCurrentReportData() && !loading && (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-600 mb-4">
              Select month, year, and any filters, then click "Generate Report" to create your first monthly summary.
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Report
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;