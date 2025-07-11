import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, ShoppingCart, Clock, User, Receipt, Check, Printer } from 'lucide-react';
import { printOrder } from '../utils/printOrder';
import { Table } from '../types';

interface ViewOrderModalProps {
  table: Table;
  onClose: () => void;
  onCompleteOrder?: (tableId: string, orderItems: any[], total: number) => void;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  taxRate: number;
}

const ViewOrderModal: React.FC<ViewOrderModalProps> = ({ 
  table, 
  onClose, 
  onCompleteOrder,
  serviceChargeRate, 
  serviceChargeEnabled,
  taxRate 
}) => {
  const { t } = useLanguage();
  
  const getSubtotal = () => {
    if (!Array.isArray(table.orderItems)) return 0;
    return table.orderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getServiceCharge = () => {
    if (!serviceChargeEnabled) return 0;
    return (getSubtotal() * serviceChargeRate) / 100;
  };

  const getTaxAmount = () => {
    return (getSubtotal() * taxRate) / 100;
  };

  const getTotalAmount = () => {
    return getSubtotal() + getServiceCharge() + getTaxAmount();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCompleteOrder = () => {
    if (!Array.isArray(table.orderItems) || table.orderItems.length === 0) {
      alert(t('noOrderItems'));
      return;
    }

    if (onCompleteOrder) {
      const total = getTotalAmount();
      onCompleteOrder(table.id, table.orderItems, total);
      onClose();
    }
  };

  const handlePrintOrder = () => {
    if (!Array.isArray(table.orderItems) || table.orderItems.length === 0) {
      alert(t('noOrderItems'));
      return;
    }

    const printData = {
      orderId: table.orderId || 'N/A',
      tableNumber: table.number,
      customerName: table.customer || 'Walk-in Customer',
      orderDate: new Date().toLocaleDateString(),
      items: table.orderItems,
      subtotal: getSubtotal(),
      serviceCharge: getServiceCharge(),
      tax: getTaxAmount(),
      total: getTotalAmount(),
      restaurantName: 'Restaurant POS',
      serviceChargeRate,
      taxRate
    };

    printOrder(printData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Receipt className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails')}</h2>
                <p className="text-blue-100 text-sm">{t('tableNumber', { number: table.number })}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-blue-100 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Table Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t('customer')}</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {table.customer || t('customer')}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Order ID</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {table.orderId || 'N/A'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                table.status === 'occupied' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : table.status === 'reserved'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {t(table.status)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          {Array.isArray(table.orderItems) && table.orderItems.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {t('orderItems')} ({table.orderItems.length})
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {table.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                      <p className="text-sm text-gray-600">{item.menuItem.category}</p>
                      <p className="text-sm text-gray-500">{item.menuItem.description}</p>
                      {item.notes && (
                        <p className="text-sm text-blue-600 mt-1">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600">
                        MMK {item.menuItem.price.toLocaleString()} × {item.quantity}
                      </div>
                      <div className="font-semibold text-gray-900">
                        MMK {(item.menuItem.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orderSummary')}</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{t('subtotal')}:</span>
                    <span className="font-semibold text-gray-900">
                      MMK {getSubtotal().toLocaleString()}
                    </span>
                  </div>
                  
                  {serviceChargeEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{t('serviceCharge')} ({serviceChargeRate}%):</span>
                    <span className="font-semibold text-gray-900">
                      MMK {getServiceCharge().toLocaleString()}
                    </span>
                  </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{t('tax')} ({taxRate}%):</span>
                    <span className="font-semibold text-gray-900">
                      MMK {getTaxAmount().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">{t('total')}:</span>
                    <span className="text-xl font-bold text-green-600">
                      MMK {getTotalAmount().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noOrderItems')}</h3>
              <p className="text-gray-500">This table doesn't have any order items yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            {Array.isArray(table.orderItems) && table.orderItems.length > 0 && (
              <button
                onClick={handlePrintOrder}
                className="flex-1 flex items-center justify-center px-4 py-3 text-sm sm:text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors min-h-[44px]"
              >
                <Printer className="h-4 w-4 mr-2" />
                {t('printOrder')}
              </button>
            )}
            {Array.isArray(table.orderItems) && table.orderItems.length > 0 && onCompleteOrder && (
              <button
                onClick={handleCompleteOrder}
                className="flex-1 flex items-center justify-center px-4 py-3 text-sm sm:text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors min-h-[44px]"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('completeOrder')}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-[44px]"
            >
              <X className="h-4 w-4 mr-2" />
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;