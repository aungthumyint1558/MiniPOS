import React from 'react';
import { Users, Clock, CheckCircle2, Coffee, Eye } from 'lucide-react';
import { Table } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getTableName } from '../utils/translations';

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
  const { t, language } = useLanguage();

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
        return <CheckCircle2 className="h-4 w-4" />;
      case 'occupied':
        return <Coffee className="h-4 w-4" />;
      case 'reserved':
        return <Clock className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
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

  // Check if table has order items to determine if View Order should be enabled
  const hasOrderItems = table.orderItems && table.orderItems.length > 0;
  const canFreeTable = !hasOrderItems; // Can't free table if it has order items

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 p-6 hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">{table.seats} seats</span>
        </div>
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
          {getStatusIcon(table.status)}
          <span className="ml-1">{getStatusText(table.status)}</span>
        </div>
      </div>
      
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getTableName(table.number, language)}</h3>
        {table.customer && (
          <p className="text-sm text-gray-600 mt-1 truncate">Customer: {table.customer}</p>
        )}
        {table.orderId && (
          <p className="text-xs text-blue-600 mt-1 truncate">Order: {table.orderId.replace('ORD-', '').replace(/-T\d+$/, '')}</p>
        )}
        {table.orderTotal && (
          <p className="text-sm text-green-600 mt-1 font-medium">
            Total: MMK {table.orderTotal.toLocaleString()}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={(e) => handleActionClick(e, () => onFree(table.id))}
            disabled={!canFreeTable}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              canFreeTable 
                ? 'text-white bg-emerald-600 hover:bg-emerald-700' 
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            {t('free')}
          </button>
          <button
            onClick={(e) => handleActionClick(e, () => onReserve(table.id))}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
          >
            {t('reserve')}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => handleActionClick(e, () => onOccupy(table.id))}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('occupy')}
          </button>
          <button
            onClick={(e) => handleActionClick(e, () => onManage(table.id))}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {t('manage')}
          </button>
        </div>

        {/* View Order Button - Full width, always enabled when there are order items */}
        <button
          onClick={(e) => handleActionClick(e, () => onViewOrder(table.id))}
          disabled={!hasOrderItems}
          className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            hasOrderItems
              ? 'text-white bg-emerald-600 hover:bg-emerald-700'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t('viewOrder')}
        </button>
      </div>
    </div>
  );
};

export default TableCard;