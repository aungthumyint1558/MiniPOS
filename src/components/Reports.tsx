import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Trash2, Download, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table } from '../types';
import * as XLSX from 'xlsx';

interface ReportsProps {
  tables?: Table[];
  orderHistory?: any[];
  onClearOrderHistory?: () => void;
}

const Reports: React.FC<ReportsProps> = ({ tables = [], orderHistory = [], onClearOrderHistory }) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);

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
      
      // Prepare data for Excel
      const excelData = dataToExport.map(order => ({
        'Order ID': order.id,
        'Table Number': order.tableNumber,
        'Customer Name': order.customerName,
        'Order Date': order.orderDate,
        'Status': order.status,
        'Total (MMK)': order.total
      }));

      // Add summary row
      excelData.push({
        'Order ID': '',
        'Table Number': '',
        'Customer Name': '',
        'Order Date': 'TOTAL',
        'Status': `${dataToExport.length} orders`,
        'Total (MMK)': dataToExport.reduce((sum, order) => sum + order.total, 0)
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Order ID
        { wch: 12 }, // Table Number
        { wch: 20 }, // Customer Name
        { wch: 12 }, // Order Date
        { wch: 12 }, // Status
        { wch: 15 }  // Total
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Order History');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = selectedDate 
        ? `order-history-${selectedDate}.xlsx`
        : `order-history-${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message
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
      doc.text('Order History Report', 20, 20);
      
      // Add date range if filtered
      if (selectedDate) {
        doc.setFontSize(12);
        doc.text(`Date: ${selectedDate}`, 20, 35);
      }
      
      // Prepare table data
      const tableData = dataToExport.map(order => [
        order.id,
        order.tableNumber.toString(),
        order.customerName,
        order.orderDate,
        order.status,
        `MMK ${order.total.toLocaleString()}`
      ]);
      
      // Add table
      autoTable(doc, {
        head: [['Order ID', 'Table', 'Customer', 'Date', 'Status', 'Total']],
        body: tableData,
        startY: selectedDate ? 45 : 35,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
        },
      });
      
      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total Orders: ${dataToExport.length}`, 20, finalY);
      doc.text(`Total Revenue: MMK ${dataToExport.reduce((sum, order) => sum + order.total, 0).toLocaleString()}`, 20, finalY + 10);
      
      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = selectedDate 
        ? `order-history-${selectedDate}.pdf`
        : `order-history-${currentDate}.pdf`;
      
      // Save PDF
      doc.save(filename);
      
      alert(`PDF file "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orderHistory;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg lg:text-2xl font-bold text-white">{t('reportsAnalytics')}</h2>
              <p className="text-blue-100 text-sm lg:text-base">{t('trackPerformance')}</p>
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
                  className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-100 bg-blue-500 rounded-md hover:bg-blue-400 transition-colors"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('filterDate')}</span>
                  <span className="sm:hidden">{t('filterDate')}</span>
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
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-100 bg-red-500 rounded-md hover:bg-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('clear')}</span>
                <span className="sm:hidden">{t('clear')}</span>
              </button>
              
              <button
                onClick={handleExportPDF}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-purple-100 bg-purple-500 rounded-md hover:bg-purple-400 transition-colors"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('exportToPDF')}</span>
                <span className="sm:hidden">PDF</span>
              </button>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-green-100 bg-green-500 rounded-md hover:bg-green-400 transition-colors"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('exportToExcel')}</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Order History Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white">{t('orderHistory')}</h3>
              <p className="text-green-100 text-sm">{t('noCompletedOrders')}</p>
            </div>
            
            <div className="p-4 lg:p-6">
              {displayOrders.length > 0 ? (
                <div className="space-y-3 lg:space-y-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
                  {displayOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] lg:min-h-[300px] bg-gray-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
                  <h4 className="text-base lg:text-lg font-medium text-gray-600 mb-2">No completed orders yet</h4>
                  <p className="text-sm lg:text-base text-gray-500 text-center">Orders will appear here once completed</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* Revenue Summary */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-lg p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-white">Revenue Summary</h3>
                <p className="text-purple-100 text-sm">Financial overview</p>
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
                <p className="text-indigo-100 text-sm">Current table availability</p>
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
      </div>
    </div>
  );
};

export default Reports;