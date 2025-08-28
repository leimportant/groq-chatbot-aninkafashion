/**
 * OrderApi.ts
 * API service for order-related operations
 */

interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Mock order database
// In a real application, this would be replaced with actual API calls
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'cust-123',
    items: [
      {
        productId: 'p001',
        productName: 'Dress Batik Modern',
        quantity: 1,
        price: 350000
      }
    ],
    totalAmount: 350000,
    status: OrderStatus.SHIPPED,
    trackingNumber: 'TRK-12345',
    createdAt: new Date('2023-10-15'),
    updatedAt: new Date('2023-10-16')
  },
  {
    id: 'ORD-002',
    customerId: 'cust-456',
    items: [
      {
        productId: 'p002',
        productName: 'Kemeja Pria Slim Fit',
        quantity: 2,
        price: 250000
      },
      {
        productId: 'p003',
        productName: 'Celana Jeans Wanita',
        quantity: 1,
        price: 280000
      }
    ],
    totalAmount: 780000,
    status: OrderStatus.PROCESSING,
    createdAt: new Date('2023-10-18'),
    updatedAt: new Date('2023-10-18')
  },
  {
    id: 'ORD-003',
    customerId: 'cust-789',
    items: [
      {
        productId: 'p005',
        productName: 'Sepatu Sneakers Casual',
        quantity: 1,
        price: 320000
      }
    ],
    totalAmount: 320000,
    status: OrderStatus.DELIVERED,
    trackingNumber: 'TRK-67890',
    createdAt: new Date('2023-10-10'),
    updatedAt: new Date('2023-10-14')
  }
];

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Case-insensitive search
  const order = mockOrders.find(order => 
    order.id.toLowerCase() === orderId.toLowerCase()
  );
  
  return order || null;
};

/**
 * Get orders by customer ID
 */
export const getOrdersByCustomerId = async (customerId: string): Promise<Order[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return mockOrders.filter(order => order.customerId === customerId);
};

/**
 * Format order information for chat response
 */
export const formatOrderResponse = (order: Order | null): string => {
  if (!order) {
    return 'Maaf, saya tidak dapat menemukan pesanan dengan ID tersebut. Mohon periksa kembali nomor pesanan Anda.';
  }
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusInIndonesian = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Menunggu Pembayaran',
      [OrderStatus.PROCESSING]: 'Sedang Diproses',
      [OrderStatus.SHIPPED]: 'Dalam Pengiriman',
      [OrderStatus.DELIVERED]: 'Telah Diterima',
      [OrderStatus.CANCELLED]: 'Dibatalkan'
    };
    
    return statusMap[status];
  };
  
  let response = `Informasi Pesanan **${order.id}**:\n\n`;
  response += `Status: **${getStatusInIndonesian(order.status)}**\n`;
  response += `Tanggal Pemesanan: ${formatDate(order.createdAt)}\n`;
  
  if (order.trackingNumber && order.status === OrderStatus.SHIPPED) {
    response += `Nomor Pelacakan: ${order.trackingNumber}\n`;
    response += `Pesanan Anda sedang dalam perjalanan. Anda dapat melacak pengiriman dengan nomor pelacakan di atas.\n`;
  }
  
  response += `\nDetail Pesanan:\n`;
  order.items.forEach((item, index) => {
    response += `${index + 1}. ${item.productName} (${item.quantity} x Rp ${item.price.toLocaleString('id-ID')})\n`;
  });
  
  response += `\nTotal: Rp ${order.totalAmount.toLocaleString('id-ID')}`;
  
  return response;
};

/**
 * Format tracking information for chat response
 */
export const formatTrackingResponse = (order: Order | null): string => {
  if (!order) {
    return 'Maaf, saya tidak dapat menemukan pesanan dengan ID tersebut. Mohon periksa kembali nomor pesanan Anda.';
  }
  
  if (!order.trackingNumber) {
    return `Pesanan ${order.id} belum memiliki nomor pelacakan. Status pesanan Anda saat ini: ${order.status}.`;
  }
  
  // Mock tracking information based on order status
  let trackingInfo = '';
  
  switch (order.status) {
    case OrderStatus.PROCESSING:
      trackingInfo = 'Pesanan Anda sedang diproses dan akan segera dikirim.';
      break;
    case OrderStatus.SHIPPED:
      trackingInfo = `Pesanan Anda sedang dalam pengiriman dengan nomor resi ${order.trackingNumber}. Estimasi tiba dalam 2-3 hari kerja.`;
      break;
    case OrderStatus.DELIVERED:
      trackingInfo = `Pesanan Anda telah diterima pada ${order.updatedAt.toLocaleDateString('id-ID')}.`;
      break;
    default:
      trackingInfo = `Status pesanan Anda saat ini: ${order.status}.`;
  }
  
  return trackingInfo;
};