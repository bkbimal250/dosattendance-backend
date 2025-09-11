import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { User, Eye, Edit, MessageSquare } from 'lucide-react';

const UsersGrid = ({ recentUsers }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Recent Users</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recentUsers.map((user, index) => (
          <Card key={index} className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200" hover>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/30 opacity-40"></div>
            
            <Card.Body className="relative p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm group-hover:text-gray-800 transition-colors">
                    {user.first_name} {user.last_name}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {user.role || 'User'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 p-1">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 p-1">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 p-1">
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
                <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-200/20 rounded-full -translate-y-4 translate-x-4"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-indigo-200/20 rounded-full translate-y-3 -translate-x-3"></div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UsersGrid;
