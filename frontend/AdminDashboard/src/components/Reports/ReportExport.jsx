import React from 'react';
import { Button } from '../ui';
import { Download, FileText, FileDown } from 'lucide-react';

const ReportExport = ({ data, type }) => {
  if (!data) return null;

  const exportToCSV = () => {
    let csvContent = '';
    let headers = [];
    let rows = [];

    switch (type) {
      case 'monthly_summary':
        if (data.employeeData && data.employeeData.length > 0) {
          headers = [
            'Employee Name',
            'Employee ID',
            'Office',
            'Total Days',
            'Present Days',
            'Absent Days',
            'Late Days',
            'Attendance Rate (%)',
            'Total Hours',
            'Standard Hours',
            'Hours Deficit'
          ];
          
          rows = data.employeeData.map(record => [
            record.user_name || 'N/A',
            record.employee_id || 'N/A',
            record.office || 'N/A',
            record.total_days || 0,
            record.present_days || 0,
            record.absent_days || 0,
            record.late_days || 0,
            record.attendance_percentage || 0,
            record.total_hours || 0,
            record.standard_hours || 0,
            record.hours_deficit || 0
          ]);
        }
        break;

      case 'attendance':
        if (data.rawData && data.rawData.length > 0) {
          headers = [
            'Employee Name',
            'Employee ID',
            'Office',
            'Date',
            'Check-in Time',
            'Check-out Time',
            'Status',
            'Total Hours'
          ];
          
          rows = data.rawData.map(record => [
            `${record.user__first_name || ''} ${record.user__last_name || ''}`.trim() || 'N/A',
            record.user__employee_id || 'N/A',
            record.user__office__name || 'N/A',
            record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
            record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A',
            record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'N/A',
            record.status || 'N/A',
            record.total_hours || 'N/A'
          ]);
        }
        break;

      default:
        return null;
    }

    if (rows.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        generatePDF(jsPDF, autoTable);
      }).catch(() => {
        // Fallback if autoTable is not available
        generateSimplePDF(jsPDF);
      });
    }).catch(() => {
      alert('PDF generation failed. Please try again or use CSV export.');
    });
  };

  const generatePDF = (jsPDF, autoTable) => {
    const doc = new jsPDF();
    
    // Add title
    const title = `${type.replace('_', ' ').toUpperCase()} REPORT`;
    doc.setFontSize(20);
    doc.text(title, 105, 20, { align: 'center' });
    
    // Add period info for monthly summary
    if (type === 'monthly_summary' && data.period) {
      doc.setFontSize(12);
      doc.text(`Period: ${data.period.start_date} to ${data.period.end_date}`, 20, 35);
      doc.text(`Total Days: ${data.period.total_days}`, 20, 45);
    }
    
    // Add summary statistics
    if (data.summary) {
      doc.setFontSize(14);
      doc.text('Summary', 20, 60);
      doc.setFontSize(10);
      doc.text(`Total Employees: ${data.summary.totalEmployees}`, 20, 75);
      doc.text(`Total Present Days: ${data.summary.totalPresentDays}`, 20, 85);
      doc.text(`Total Absent Days: ${data.summary.totalAbsentDays}`, 20, 95);
      doc.text(`Total Late Days: ${data.summary.totalLateDays}`, 20, 105);
      doc.text(`Total Hours: ${data.summary.totalHours}`, 20, 115);
      doc.text(`Average Attendance Rate: ${data.summary.averageAttendanceRate}%`, 20, 125);
    }
    
    // Add data table
    if (type === 'monthly_summary' && data.employeeData) {
      const tableData = data.employeeData.map(record => [
        record.user_name || 'N/A',
        record.employee_id || 'N/A',
        record.office || 'N/A',
        record.total_days || 0,
        record.present_days || 0,
        record.absent_days || 0,
        record.late_days || 0,
        `${record.attendance_percentage || 0}%`,
        record.total_hours || 0
      ]);
      
      autoTable(doc, {
        head: [['Name', 'ID', 'Office', 'Days', 'Present', 'Absent', 'Late', 'Rate', 'Hours']],
        body: tableData,
        startY: 140,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }
    
    // Save the PDF
    const fileName = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateSimplePDF = (jsPDF) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${type.replace('_', ' ').toUpperCase()} REPORT`, 105, 20, { align: 'center' });
    
    // Add summary
    if (data.summary) {
      doc.setFontSize(14);
      doc.text('Summary', 20, 40);
      doc.setFontSize(10);
      doc.text(`Total Employees: ${data.summary.totalEmployees}`, 20, 55);
      doc.text(`Total Present Days: ${data.summary.totalPresentDays}`, 20, 65);
      doc.text(`Total Absent Days: ${data.summary.totalAbsentDays}`, 20, 75);
      doc.text(`Average Attendance Rate: ${data.summary.averageAttendanceRate}%`, 20, 85);
    }
    
    // Add note about detailed data
    doc.setFontSize(10);
    doc.text('Detailed data available in CSV export', 20, 110);
    
    // Save the PDF
    const fileName = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getExportButtonText = () => {
    switch (type) {
      case 'monthly_summary':
        return 'Export Monthly Summary';
      case 'attendance':
        return 'Export Attendance';
      default:
        return 'Export';
    }
  };

  const getRecordCount = () => {
    switch (type) {
      case 'monthly_summary':
        return data.employeeData?.length || 0;
      case 'attendance':
        return data.rawData?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-500">
        {getRecordCount()} records
      </span>
      
      {/* CSV Export Button */}
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <FileText className="w-4 h-4" />
        <span>CSV</span>
      </Button>
      
      {/* PDF Export Button */}
      <Button
        onClick={exportToPDF}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <FileDown className="w-4 h-4" />
        <span>PDF</span>
      </Button>
    </div>
  );
};

export default ReportExport;
