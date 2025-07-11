import React from 'react';
import { Users, Clock, CheckCircle2, Coffee, Eye } from 'lucide-react';
import { Table } from '../types';

interface TableCardProps {
  table: Table;
  onFree: (tableId: string) => void;
  onReserve: (tableId: string) => void;
  onManage: (tableId: string) => void;
  onOccupy: (tableId: string) => void;
  onViewOrder: (tableId: string) => void;
  isSelected?: boolean;
}

const TableCard: React.FC<TableCardProps> = ({ 
  table, 
  onFree, 
  onReserve, 
  onManage, 
  onOccupy, 
  onViewOrder,
  isSelected = false 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800';
      case 'occupied':
        return 'bg-gray-100 text-gray-800';
      case 'reserved':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'occupied':
        return <Coffee className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'reserved':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Users className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      default:
        return 'Unknown';
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
          <span className="text-xs sm:text-sm text-gray-600">{table.seats} seats</span>
        </div>
        <div className={`inline-flex items-center px-1.5 sm:px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
          {getStatusIcon(table.status)}
          <span className="ml-1 hidden sm:inline">{getStatusText(table.status)}</span>
        </div>
      </div>
      
      <div className="text-center mb-2 sm:mb-3 lg:mb-4">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Table {table.number}</h3>
        {table.customer && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">Customer: {table.customer}</p>
        )}
        {table.orderId && (
          <p className="text-xs text-blue-600 mt-1 truncate">Order: {table.orderId}</p>
        )}
        {table.orderTotal && (
          <p className="text-xs sm:text-sm text-green-600 mt-1 font-medium">
            Total: MMK {table.orderTotal.toLocaleString()}
          </p>
        )}
      </div>
      
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={(e) => handleActionClick(e, () => onFree(table.id))}
            className="flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
          >
            Free
          </button>
          <button
            onClick={(e) => handleActionClick(e, () => onReserve(table.id))}
            className="flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
          >
            Reserve
          </button>
        </div>
        
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={(e) => handleActionClick(e, () => onOccupy(table.id))}
            className="flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Occupy
          </button>
          <button
            onClick={(e) => handleActionClick(e, () => onManage(table.id))}
            className="flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Manage
          </button>
        </div>

        {/* View Order Button */}
        <button
          onClick={(e) => handleActionClick(e, () => onViewOrder(table.id))}
          className="w-full flex items-center justify-center px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          View Order
        </button>
      </div>
    </div>
  );
};

export default TableCard;