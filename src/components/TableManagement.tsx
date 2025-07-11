import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit, Trash2, X, Save, Users, ShoppingCart } from 'lucide-react';
import { Table, OrderItem } from '../types';
import { DatabaseSettings } from '../database/localStorage';
import { generateTableOrderId } from '../utils/orderIdGenerator';
import TableCard from './TableCard';
import OrderingSystem from './OrderingSystem';
import ViewOrderModal from './ViewOrderModal';

interface TableManagementProps {
  tables: Table[];
  menuItems: any[];
  onUpdateTable: (table: Table) => void;
  onDeleteTable: (tableId: string) => void;
  onAddTable: () => void;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  taxRate: number;
  onCompleteOrder: (tableId: string, orderItems: OrderItem[], total: number) => void;
  settings: DatabaseSettings | null;
}

const TableManagement: React.FC<TableManagementProps> = ({ 
  tables, 
  menuItems,
  onUpdateTable, 
  onDeleteTable, 
  onAddTable,
  serviceChargeRate,
  serviceChargeEnabled,
  taxRate,
  onCompleteOrder,
  settings
}) => {
  const { t } = useLanguage();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderingTable, setOrderingTable] = useState<Table | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewOrderModal, setShowViewOrderModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [viewingTable, setViewingTable] = useState<Table | null>(null);

  const handleStartOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      // Set table as occupied when starting an order, preserve existing order items
      const updatedTable = { 
        ...table, 
        status: 'occupied' as const,
        orderItems: table.orderItems || []
      };
      onUpdateTable(updatedTable);
      setOrderingTable(updatedTable);
    }
  };

  const handleCompleteOrder = (tableId: string, orderItems: OrderItem[], total: number) => {
    onCompleteOrder(tableId, orderItems, total);
    setOrderingTable(null);
    setSelectedTable(null);
    alert(`Order completed successfully!\nTotal: MMK ${total.toLocaleString()}`);
  };

  const handleSaveOrder = (tableId: string, orderItems: OrderItem[], total: number) => {
    // Save order but keep table occupied
    const table = tables.find(t => t.id === tableId);
    if (table) {
      onUpdateTable({ 
        ...table, 
        status: 'occupied',
        orderItems: orderItems,
        orderTotal: total,
        orderId: `order-${Date.now()}`
      });
    }

    setOrderingTable(null);
    setSelectedTable(null);
    
    alert(`Order saved successfully!\nTotal: MMK ${total.toLocaleString()}\nTable ${table?.number} remains occupied with saved order.`);
  };

  const handleBackFromOrdering = () => {
    // When going back, keep the table as occupied if it was occupied
    setOrderingTable(null);
  };

  const handleFreeTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      onUpdateTable({ 
        ...table, 
        status: 'available', 
        orderId: undefined, 
        customer: undefined,
        orderItems: undefined,
        orderTotal: undefined
      });
    }
  };

  const handleReserveTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const customer = prompt('Enter customer name:');
      if (customer) {
        onUpdateTable({ 
          ...table, 
          status: 'reserved', 
          customer,
          reservationTime: new Date() 
        });
      }
    }
  };

  const handleManageTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setEditingTable({ ...table });
      setShowEditModal(true);
    }
  };

  const handleViewOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setViewingTable(table);
      setShowViewOrderModal(true);
    }
  };

  const handleCancelOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      onUpdateTable({ 
        ...table, 
        status: 'available',
        orderItems: undefined,
        orderTotal: undefined,
        orderId: undefined,
        customer: undefined
      });
    }
  };

  const handleEditTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setEditingTable({ ...table });
      setShowEditModal(true);
    }
  };

  const handleDeleteTableClick = (tableId: string) => {
    setTableToDelete(tableId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTable = () => {
    if (tableToDelete) {
      onDeleteTable(tableToDelete);
      setTableToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const saveTableChanges = () => {
    if (editingTable) {
      onUpdateTable(editingTable);
      setEditingTable(null);
      setShowEditModal(false);
    }
  };

  const handleOccupyTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const customer = prompt('Enter customer name:');
      if (customer) {
        const orderId = generateTableOrderId(table.number);
        onUpdateTable({ 
          ...table, 
          status: 'occupied', 
          customer,
          orderId: orderId
        });
      }
    }
  };

  // If we're in ordering mode, show the ordering system
  if (orderingTable) {
    return (
      <OrderingSystem
        table={orderingTable}
        menuItems={menuItems}
        onCompleteOrder={handleCompleteOrder}
        onSaveOrder={handleSaveOrder}
        onBack={handleBackFromOrdering}
        serviceChargeRate={settings?.serviceCharge || 10}
        serviceChargeEnabled={settings?.serviceChargeEnabled ?? true}
        taxRate={settings?.taxRate || 8.5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-2xl font-bold text-white">{t('tables')}</h2>
              <p className="text-blue-100 text-sm lg:text-base">Manage your restaurant tables efficiently</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:space-x-3 lg:gap-0">
              <button
                onClick={() => selectedTable && handleStartOrder(selectedTable)}
                disabled={!selectedTable}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors min-w-[120px] h-10 ${
                  selectedTable 
                    ? 'text-green-100 bg-green-500 hover:bg-green-400' 
                    : 'text-green-300 bg-green-600 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('startOrder')}
              </button>
              <button
                onClick={() => selectedTable && handleEditTable(selectedTable)}
                disabled={!selectedTable}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors min-w-[130px] h-10 ${
                  selectedTable 
                    ? 'text-blue-100 bg-blue-500 hover:bg-blue-400' 
                    : 'text-blue-300 bg-blue-600 cursor-not-allowed'
                }`}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('manageTable')}
              </button>
              <button
                onClick={() => selectedTable && handleDeleteTableClick(selectedTable)}
                disabled={!selectedTable}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors min-w-[120px] h-10 ${
                  selectedTable 
                    ? 'text-red-100 bg-red-500 hover:bg-red-400' 
                    : 'text-red-300 bg-red-600 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteTable')}
              </button>
              <button
                onClick={onAddTable}
                className="flex items-center px-4 py-2 text-sm font-medium text-green-100 bg-green-500 rounded-md hover:bg-green-400 transition-colors min-w-[110px] h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addTable')}
              </button>
            </div>
          </div>
          {selectedTable && (
            <div className="mt-3 lg:mt-4 text-blue-100 text-sm lg:text-base">
              {t('tableNumber', { number: tables.find(t => t.id === selectedTable)?.number })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
              className={`cursor-pointer transition-all ${
                selectedTable === table.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              <TableCard
                table={table}
                onFree={handleFreeTable}
                onReserve={handleReserveTable}
                onManage={handleManageTable}
                onOccupy={handleOccupyTable}
                onViewOrder={handleViewOrder}
                isSelected={selectedTable === table.id}
              />
            </div>
          ))}
        </div>

        {/* Edit Table Modal */}
        {showEditModal && editingTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Edit Table {editingTable.number}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Table Number</label>
                  <input
                    type="number"
                    value={editingTable.number}
                    onChange={(e) => setEditingTable({ ...editingTable, number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Number of Seats</label>
                  <input
                    type="number"
                    value={editingTable.seats}
                    onChange={(e) => setEditingTable({ ...editingTable, seats: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingTable.status}
                    onChange={(e) => setEditingTable({ ...editingTable, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
                {editingTable.status !== 'available' && (
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={editingTable.customer || ''}
                      onChange={(e) => setEditingTable({ ...editingTable, customer: e.target.value })}
                      className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={saveTableChanges}
                  className="flex items-center justify-center px-4 py-2 text-sm lg:text-base text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex items-center justify-center px-4 py-2 text-sm lg:text-base text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <X className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && tableToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Delete Table</h3>
              <p className="text-sm lg:text-base text-gray-600 mb-6">
                Are you sure you want to delete Table {tables.find(t => t.id === tableToDelete)?.number}? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={confirmDeleteTable}
                  className="flex items-center justify-center px-4 py-2 text-sm lg:text-base text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex items-center justify-center px-4 py-2 text-sm lg:text-base text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <X className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      {showViewOrderModal && viewingTable && (
        <ViewOrderModal
          table={viewingTable}
          onClose={() => {
            setShowViewOrderModal(false);
            setViewingTable(null);
          }}
          onCompleteOrder={handleCompleteOrder}
          onCancelOrder={handleCancelOrder}
          serviceChargeRate={settings?.serviceCharge || 10}
          serviceChargeEnabled={settings?.serviceChargeEnabled ?? true}
          taxRate={settings?.taxRate || 8.5}
        />
      )}
    </div>
  );
};

export default TableManagement;