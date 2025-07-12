import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, X, Check, ArrowLeft, Save } from 'lucide-react';
import { Table, MenuItem, OrderItem } from '../types';
import { generateTableOrderId } from '../utils/orderIdGenerator';
import { useLanguage } from '../contexts/LanguageContext';
import { getTableName } from '../utils/translations';

interface OrderingSystemProps {
  table: Table;
  menuItems: MenuItem[];
  onCompleteOrder: (tableId: string, orderItems: OrderItem[], total: number) => void;
  onSaveOrder: (tableId: string, orderItems: OrderItem[], total: number) => void;
  onBack: () => void;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  taxRate: number;
}

const OrderingSystem: React.FC<OrderingSystemProps> = ({
  table,
  menuItems,
  onCompleteOrder,
  onSaveOrder,
  onBack,
  serviceChargeRate,
  serviceChargeEnabled,
  taxRate
}) => {
  const { t, language } = useLanguage();
  const [orderItems, setOrderItems] = useState<OrderItem[]>(table.orderItems || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newOrderItem: OrderItem = {
        id: Date.now().toString(),
        menuItem,
        quantity: 1
      };
      setOrderItems([...orderItems, newOrderItem]);
    }
  };

  const removeFromOrder = (menuItemId: string) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setOrderItems(orderItems.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setOrderItems(orderItems.filter(item => item.menuItem.id !== menuItemId));
    }
  };

  const getItemQuantity = (menuItemId: string) => {
    const item = orderItems.find(item => item.menuItem.id === menuItemId);
    return item ? item.quantity : 0;
  };

  const getSubtotal = () => {
    return orderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
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

  const handleCompleteOrder = () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order before completing.');
      return;
    }

    const total = getTotalAmount();
    onCompleteOrder(table.id, orderItems, total);
  };

  const handleSaveOrder = () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order before saving.');
      return;
    }

    const total = getTotalAmount();
    const orderId = table.orderId || generateTableOrderId(table.number);
    onSaveOrder(table.id, orderItems, total);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-2 text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-white">{getTableName(table.number, language)}</h2>
            <p className="text-blue-100 text-sm">{table.seats} seats</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">MMK {getTotalAmount().toLocaleString()}</div>
            <div className="text-blue-100 text-xs">{orderItems.length} items</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-blue-100 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">{getTableName(table.number, language)} - Order</h2>
                <p className="text-blue-100">{table.seats} seats • {table.customer || 'No customer assigned'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">MMK {getTotalAmount().toLocaleString()}</div>
              <div className="text-blue-100">{orderItems.length} items in cart</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Menu Items Section */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 lg:p-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 text-sm lg:text-base rounded-lg font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Items' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-24 sm:h-32 object-cover"
                    />
                  )}
                  <div className="p-3 lg:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{item.name}</h3>
                        <p className="text-xs lg:text-sm text-blue-600 font-medium">{item.category}</p>
                        <p className="text-xs lg:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-sm lg:text-base font-bold text-green-600">MMK {item.price.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromOrder(item.id)}
                          disabled={getItemQuantity(item.id) === 0}
                          className="p-1.5 lg:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                        </button>
                        <span className="text-sm lg:text-base font-semibold text-gray-900 min-w-[1.5rem] lg:min-w-[2rem] text-center">
                          {getItemQuantity(item.id)}
                        </span>
                        <button
                          onClick={() => addToOrder(item)}
                          className="p-1.5 lg:p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        >
                          <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => addToOrder(item)}
                        className="px-3 py-1.5 lg:px-4 lg:py-2 bg-blue-600 text-white text-sm lg:text-base rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 lg:p-8 text-center">
                <div className="text-gray-500">No menu items found in this category.</div>
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 sticky top-4">
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base lg:text-lg font-bold text-white">Order Summary</h3>
                  <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              </div>
              
              <div className="p-3 lg:p-4">
                {orderItems.length === 0 ? (
                  <div className="text-center py-6 lg:py-8 text-gray-500">
                    <ShoppingCart className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-3 lg:mb-4 text-gray-300" />
                    <p className="text-sm lg:text-base">No items in cart</p>
                    <p className="text-xs lg:text-sm">Add items from the menu</p>
                  </div>
                ) : (
                  <div className="space-y-2 lg:space-y-3 max-h-64 lg:max-h-96 overflow-y-auto">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm lg:text-base truncate">{item.menuItem.name}</h4>
                          <p className="text-xs lg:text-sm text-gray-600">MMK {item.menuItem.price.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center space-x-1 lg:space-x-2 mx-2">
                          <button
                            onClick={() => removeFromOrder(item.menuItem.id)}
                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <Minus className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                          </button>
                          <span className="text-xs lg:text-sm font-semibold text-gray-900 min-w-[1rem] lg:min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToOrder(item.menuItem)}
                            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                          </button>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-gray-900 text-xs lg:text-sm">
                            MMK {(item.menuItem.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {orderItems.length > 0 && (
                  <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200">
                    {/* Subtotal */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm lg:text-base text-gray-700">{t('subtotal')}:</span>
                      <span className="text-sm lg:text-base font-semibold text-gray-900">
                        MMK {getSubtotal().toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Service Charge */}
                    {serviceChargeEnabled && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm lg:text-base text-gray-700">{t('serviceCharge')} ({serviceChargeRate}%):</span>
                      <span className="text-sm lg:text-base font-semibold text-gray-900">
                        MMK {getServiceCharge().toLocaleString()}
                      </span>
                    </div>
                    )}
                    
                    {/* Tax */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm lg:text-base text-gray-700">{t('tax')} ({taxRate}%):</span>
                      <span className="text-sm lg:text-base font-semibold text-gray-900">
                        MMK {getTaxAmount().toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Total */}
                    <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-200">
                      <span className="text-base lg:text-lg font-semibold text-gray-900">{t('total')}:</span>
                      <span className="text-lg lg:text-2xl font-bold text-green-600">
                        MMK {getTotalAmount().toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={handleSaveOrder}
                        className="w-full flex items-center justify-center px-4 lg:px-6 py-2.5 lg:py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                      >
                        <Save className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                        {t('saveOrder')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderingSystem;