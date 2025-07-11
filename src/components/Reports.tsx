import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Trash2, Download, BarChart3, FileText, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table } from '../types';
import * as XLSX from 'xlsx';

interface ReportsProps {
  tables?: Table[];
  orderHistory?: any[];
  onClearOrderHistory?: () => void;
  settings?: any;
}

const Reports: React.FC<ReportsProps> = ({ tables = [], orderHistory = [], onClearOrderHistory, settings }) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Calculate table status counts
  const availableTables = tables.filter(table => table.status === 'available').length;
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const reservedTables = tables.filter(table => table.status === 'reserved').length;

  // Calculate totals
  const totalOrders = filteredOrders.length || orderHistory.length;
  const totalRevenue = filteredOrders.length > 0 
    ? filteredOrders.reduce((sum, order) => sum + order.total, 0)
    : orderHistory.reduce((sum, order) => sum + order.total, 0);

  const handleFilterDate = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const filtered = orderHistory.filter(order => order.orderDate === date);
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders([]);
    }
    setShowDatePicker(false);
  };

  const handleClear = () => {
    const confirmed = window.confirm(t('confirmDelete'));
    
    if (confirmed) {
      if (onClearOrderHistory) {
        onClearOrderHistory();
      }
      setSelectedDate('');
      setFilteredOrders([]);
      setShowDatePicker(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredOrders.length > 0 ? filteredOrders : orderHistory;
      
      // Prepare detailed data for Excel with order items
      const excelData: any[] = [];
      
      dataToExport.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any, index: number) => {
            excelData.push({
              'Order ID': index === 0 ? order.id : '', // Only show order ID on first item
              'Table Number': index === 0 ? order.tableNumber : '',
              'Customer Name': index === 0 ? order.customerName : '',
              'Order Date': index === 0 ? order.orderDate : '',
              'Order Status': index === 0 ? order.status : '',
              'Item Name': item.name || item.menuItem?.name || 'Unknown Item',
              'Item Description': item.description || item.menuItem?.description || '',
              'Item Category': item.category || item.menuItem?.category || '',
              'Unit Price (MMK)': item.price || item.menuItem?.price || 0,
              'Quantity': item.quantity || 1,
              'Item Total (MMK)': (item.price || item.menuItem?.price || 0) * (item.quantity || 1),
              'Order Total (MMK)': index === 0 ? order.total : ''
            });
          });
        } else {
          // Fallback for orders without detailed items
          excelData.push({
            'Order ID': order.id,
            'Table Number': order.tableNumber,
            'Customer Name': order.customerName,
            'Order Date': order.orderDate,
            'Order Status': order.status,
            'Item Name': 'No items available',
            'Item Description': '',
            'Item Category': '',
            'Unit Price (MMK)': 0,
            'Quantity': 0,
            'Item Total (MMK)': 0,
            'Order Total (MMK)': order.total
          });
        }
      });

      // Add summary rows
      excelData.push({
        'Order ID': '',
        'Table Number': '',
        'Customer Name': '',
        'Order Date': '',
        'Order Status': '',
        'Item Name': '',
        'Item Description': '',
        'Item Category': '',
        'Unit Price (MMK)': '',
        'Quantity': '',
        'Item Total (MMK)': '',
        'Order Total (MMK)': ''
      });

      excelData.push({
        'Order ID': 'SUMMARY',
        'Table Number': `${dataToExport.length} orders`,
        'Customer Name': '',
        'Order Date': selectedDate || 'All dates',
        'Order Status': '',
        'Item Name': '',
        'Item Description': '',
        'Item Category': '',
        'Unit Price (MMK)': '',
        'Quantity': '',
        'Item Total (MMK)': '',
        'Order Total (MMK)': dataToExport.reduce((sum, order) => sum + order.total, 0)
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Order ID
        { wch: 12 }, // Table Number
        { wch: 20 }, // Customer Name
        { wch: 12 }, // Order Date
        { wch: 12 }, // Order Status
        { wch: 25 }, // Item Name
        { wch: 30 }, // Item Description
        { wch: 15 }, // Item Category
        { wch: 15 }, // Unit Price
        { wch: 10 }, // Quantity
        { wch: 15 }, // Item Total
        { wch: 15 }  // Order Total
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Detailed Order History');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = selectedDate 
        ? `detailed-order-history-${selectedDate}.xlsx`
        : `detailed-order-history-${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message and email option
      alert(`Excel file "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      const dataToExport = filteredOrders.length > 0 ? filteredOrders : orderHistory;
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Detailed Order History Report', 20, 20);
      
      // Add restaurant info
      if (settings?.restaurantName) {
        doc.setFontSize(14);
        doc.text(settings.restaurantName, 20, 35);
      }
      
      // Add date range if filtered
      if (selectedDate) {
        doc.setFontSize(12);
        doc.text(`Date: ${selectedDate}`, 20, 50);
      }
      
      let currentY = selectedDate ? 60 : 50;
      
      // Process each order with detailed items
      dataToExport.forEach((order, orderIndex) => {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        // Order header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Order #${order.id}`, 20, currentY);
        doc.text(`Table: ${order.tableNumber}`, 120, currentY);
        doc.text(`Total: MMK ${order.total.toLocaleString()}`, 160, currentY);
        currentY += 7;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Customer: ${order.customerName}`, 20, currentY);
        doc.text(`Date: ${order.orderDate}`, 120, currentY);
        doc.text(`Status: ${order.status}`, 160, currentY);
        currentY += 10;
        
        // Order items table
        if (order.items && Array.isArray(order.items)) {
          const itemsData = order.items.map((item: any) => [
            item.name || item.menuItem?.name || 'Unknown Item',
            item.menuItem?.category || '',
            item.quantity || 1,
            `MMK ${(item.price || item.menuItem?.price || 0).toLocaleString()}`,
            `MMK ${((item.price || item.menuItem?.price || 0) * (item.quantity || 1)).toLocaleString()}`
          ]);
          
          autoTable(doc, {
            head: [['Item Name', 'Category', 'Qty', 'Unit Price', 'Total']],
            body: itemsData,
            startY: currentY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: 255,
              fontSize: 9,
            },
            margin: { left: 20, right: 20 },
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          doc.text('No detailed items available', 20, currentY);
          currentY += 15;
        }
        
        // Add separator line between orders
        if (orderIndex < dataToExport.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(20, currentY, 190, currentY);
          currentY += 10;
        }
      });
      
      // Add summary on new page if needed
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Orders: ${dataToExport.length}`, 20, currentY);
      doc.text(`Total Revenue: MMK ${dataToExport.reduce((sum, order) => sum + order.total, 0).toLocaleString()}`, 20, currentY + 10);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, currentY + 20);
      
      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = selectedDate 
        ? `detailed-order-history-${selectedDate}.pdf`
        : `detailed-order-history-${currentDate}.pdf`;
      
      // Save PDF
      doc.save(filename);
      
      alert(`PDF file "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleSendEmail = () => {
    // This would integrate with your email service
    // For now, we'll show a success message
    alert(`Email would be sent to: ${emailRecipient}\nSubject: ${emailSubject}\n\nNote: Email integration requires backend setup with Office365.`);
    setIsEmailModalOpen(false);
    setEmailRecipient('');
    setEmailSubject('');
    setEmailMessage('');
  };

  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orderHistory;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-white">{t('reportsAnalytics')}</h2>
              <p className="text-blue-100 text-sm lg:text-base">Track your restaurant performance and analyze detailed order data</p>
              {selectedDate && (
                <div className="mt-2 text-blue-100 text-sm">
                  {t('filterDate')}: {selectedDate}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="relative">
                <button
                  onClick={handleFilterDate}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-100 bg-blue-500 rounded-md hover:bg-blue-400 transition-colors min-w-[120px] h-10"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('filterDate')}
                </button>
                {showDatePicker && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClear}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-100 bg-red-500 rounded-md hover:bg-red-400 transition-colors min-w-[80px] h-10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('clear')}
              </button>
              
              <button
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-purple-100 bg-purple-500 rounded-md hover:bg-purple-400 transition-colors min-w-[120px] h-10"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('exportToPDF')}
              </button>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center px-4 py-2 text-sm font-medium text-green-100 bg-green-500 rounded-md hover:bg-green-400 transition-colors min-w-[130px] h-10"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('exportToExcel')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Order History Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-4 lg:p-6">
              <h3 className="text-xl font-bold text-white">{t('orderHistory')}</h3>
              <p className="text-green-100 text-sm">{t('viewDetailedOrder')}</p>
            </div>
            
            <div className="p-4 lg:p-6">
              {displayOrders.length > 0 ? (
                <div className="space-y-3 lg:space-y-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
                  {displayOrders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 lg:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{order.id}</p>
                          <p className="text-xs lg:text-sm text-gray-600 truncate">
                            Table {order.tableNumber} - {order.customerName}
                          </p>
                          <p className="text-xs text-gray-500">{order.orderDate}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="font-medium text-gray-900 text-sm lg:text-base">
                            MMK {order.total.toLocaleString()}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">{t('orderItems')}:</p>
                          <div className="space-y-1">
                            {order.items.slice(0, 3).map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-xs text-gray-600">
                                <span className="truncate flex-1">
                                  {item.name || item.menuItem?.name || 'Unknown Item'} x{item.quantity || 1}
                                </span>
                                <span className="ml-2 flex-shrink-0">
                                  MMK {((item.price || item.menuItem?.price || 0) * (item.quantity || 1)).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-gray-500">+{order.items.length - 3} {t('moreItems')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] lg:min-h-[300px] bg-gray-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
                  <h4 className="text-base lg:text-lg font-medium text-gray-600 mb-2">{t('noCompletedOrdersYet')}</h4>
                  <p className="text-sm lg:text-base text-gray-500 text-center">{t('ordersWillAppear')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* Revenue Summary */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-lg p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-white">{t('revenueAnalytics')}</h3>
                <p className="text-purple-100 text-sm">{t('financialOverview')}</p>
              </div>
              
              <div className="p-4 lg:p-6">
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="bg-blue-500 rounded-lg p-4 lg:p-6 text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-white mb-2">{totalOrders}</div>
                    <div className="text-blue-100 font-medium text-sm lg:text-base">{t('totalOrders')}</div>
                  </div>
                  <div className="bg-green-500 rounded-lg p-4 lg:p-6 text-center">
                    <div className="text-xl lg:text-2xl font-bold text-white mb-2">
                      MMK {totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-green-100 font-medium text-sm lg:text-base">{t('totalRevenue')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Status */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-lg p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-white">{t('tableStatus')}</h3>
                <p className="text-indigo-100 text-sm">{t('currentTableAvailability')}</p>
              </div>
              
              <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between p-3 lg:p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 text-sm lg:text-base">{t('available')}</span>
                  </div>
                  <span className="text-xl lg:text-2xl font-bold text-gray-900">{availableTables}</span>
                </div>

                <div className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 text-sm lg:text-base">{t('occupied')}</span>
                  </div>
                  <span className="text-xl lg:text-2xl font-bold text-gray-900">{occupiedTables}</span>
                </div>

                <div className="flex items-center justify-between p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 text-sm lg:text-base">{t('reserved')}</span>
                  </div>
                  <span className="text-xl lg:text-2xl font-bold text-gray-900">{reservedTables}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    Email Report
                  </h3>
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter recipient email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Email message"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailRecipient || !emailSubject}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </button>
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;