import { OrderItem } from '../types';

export interface PrintOrderData {
  orderId: string;
  tableNumber: number;
  customerName: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  restaurantName: string;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  taxRate: number;
}

export const printOrder = (orderData: PrintOrderData) => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow popups to print the order.');
      return;
    }

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${orderData.orderId}</title>
        <style>
          body {
            font-family: ${orderData.restaurantName.includes('Myanmar') || orderData.restaurantName.includes('မြန်မာ') ? "'Pyidaungsu', 'Myanmar Text', sans-serif" : "'Courier New', monospace"};
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .receipt {
            max-width: 300px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .restaurant-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .order-info {
            margin-bottom: 15px;
          }
          .order-info div {
            margin-bottom: 3px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            margin: 0 10px;
          }
          .item-price {
            text-align: right;
            min-width: 60px;
          }
          .totals {
            margin-top: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .final-total {
            border-top: 1px solid #000;
            padding-top: 5px;
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="restaurant-name">${orderData.restaurantName}</div>
            <div>Restaurant POS System</div>
          </div>
          
          <div class="order-info">
            <div><strong>Order ID:</strong> ${orderData.orderId}</div>
            <div><strong>Table:</strong> ${orderData.tableNumber}</div>
            <div><strong>Customer:</strong> ${orderData.customerName}</div>
            <div><strong>Date:</strong> ${orderData.orderDate}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="items">
            ${orderData.items.map(item => `
              <div class="item">
                <div class="item-name">${item.menuItem.name}</div>
                <div class="item-qty">x${item.quantity}</div>
                <div class="item-price">MMK ${(item.menuItem.price * item.quantity).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>MMK ${orderData.subtotal.toLocaleString()}</span>
            </div>
            ${orderData.serviceChargeEnabled ? `
            <div class="total-line">
              <span>Service Charge (${orderData.serviceChargeRate}%):</span>
              <span>MMK ${orderData.serviceCharge.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="total-line">
              <span>Tax (${orderData.taxRate}%):</span>
              <span>MMK ${orderData.tax.toLocaleString()}</span>
            </div>
            <div class="total-line final-total">
              <span>TOTAL:</span>
              <span>MMK ${orderData.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>Thank you for your visit!</div>
            <div>Please come again</div>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px;">Print Receipt</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);

  } catch (error) {
    console.error('Print error:', error);
    alert('Failed to print order. Please try again.');
  }
};