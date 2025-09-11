import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { BarChart3, PieChart, LineChart, Download } from 'lucide-react';

const ReportsSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Quick Reports</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" hover>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/30 opacity-40"></div>
          
          <Card.Body className="relative text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 transition-colors">Attendance Report</h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Monthly attendance summary and analytics
            </p>
            <Button variant="primary" className="w-full group-hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200/20 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-blue-200/20 rounded-full translate-y-4 -translate-x-4"></div>
          </Card.Body>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" hover>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100/30 opacity-40"></div>
          
          <Card.Body className="relative text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 transition-colors">Leave Summary</h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Leave statistics and trend analysis
            </p>
            <Button variant="success" className="w-full group-hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-green-200/20 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-green-200/20 rounded-full translate-y-4 -translate-x-4"></div>
          </Card.Body>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" hover>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/30 opacity-40"></div>
          
          <Card.Body className="relative text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <LineChart className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 transition-colors">Performance Report</h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Employee performance metrics and KPIs
            </p>
            <Button variant="warning" className="w-full group-hover:bg-orange-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-orange-200/20 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-orange-200/20 rounded-full translate-y-4 -translate-x-4"></div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSection;
