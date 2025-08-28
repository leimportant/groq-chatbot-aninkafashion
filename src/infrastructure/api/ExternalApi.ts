/**
 * ExternalApi.ts
 * Service for handling external API calls to Aninka Fashion backend
 */

import axios from 'axios';
import { getAuthHeaders } from './AuthService';

// Define interfaces for API responses
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  color?: string;
  size?: string;
}

interface ApiOrder {
  id: string;
  customerId: string;
  items: ApiOrderItem[];
  totalAmount: number;
  status: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  membershipLevel: string;
  membershipPoints: number;
  registeredSince: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

// Base API URL from environment variable
const API_BASE_URL = process.env.ANINKA_APP_URL || 'https://api.aninkafashion.com';

/**
 * Search products from external API
 */
export const searchProductsExternal = async (
  keyword?: string,
  category?: string,
  color?: string,
  size?: string,
  page: number = 1,
  limit: number = 10,
  cookie?: string
): Promise<ApiProduct[]> => {
  try {
    // Build query parameters
    const params: Record<string, string | number> = { page, limit };
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (color) params.color = color;
    if (size) params.size = size;
    
    // Get auth headers if cookie is provided
    const headers = cookie ? getAuthHeaders(cookie) : {};
    
    // Make API request
    const response = await axios.get<PaginatedResponse<ApiProduct>>(
      `${API_BASE_URL}/api/products`,
      { params, headers }
    );
    
    if (response.data.success) {
      return response.data.data.items;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching products from external API:', error);
    return [];
  }
};

/**
 * Get product by ID from external API
 */
export const getProductByIdExternal = async (
  productId: string,
  cookie?: string
): Promise<ApiProduct | null> => {
  try {
    // Get auth headers if cookie is provided
    const headers = cookie ? getAuthHeaders(cookie) : {};
    
    // Make API request
    const response = await axios.get<ApiResponse<ApiProduct>>(
      `${API_BASE_URL}/api/products/${productId}`,
      { headers }
    );
    
    if (response.data.success) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting product from external API:', error);
    return null;
  }
};

/**
 * Get order by ID from external API
 */
export const getOrderByIdExternal = async (
  orderId: string,
  cookie?: string
): Promise<ApiOrder | null> => {
  try {
    // Get auth headers if cookie is provided
    const headers = cookie ? getAuthHeaders(cookie) : {};
    
    // Make API request
    const response = await axios.get<ApiResponse<ApiOrder>>(
      `${API_BASE_URL}/api/orders/${orderId}`,
      { headers }
    );
    
    if (response.data.success) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order from external API:', error);
    return null;
  }
};

/**
 * Get user status from external API
 */
export const getUserStatusExternal = async (
  userId: string,
  cookie?: string
): Promise<ApiUser | null> => {
  try {
    // Auth headers are required for user status
    if (!cookie) {
      console.error('Cookie is required for user status API');
      return null;
    }
    
    const headers = getAuthHeaders(cookie);
    
    // Make API request
    const response = await axios.get<ApiResponse<ApiUser>>(
      `${API_BASE_URL}/api/users/${userId}/status`,
      { headers }
    );
    
    if (response.data.success) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user status from external API:', error);
    return null;
  }
};

/**
 * Format product information from external API for chat response
 */
export const formatExternalProductResponse = (products: ApiProduct[]): string => {
  if (products.length === 0) {
    return 'Maaf, saya tidak menemukan produk yang sesuai dengan pencarian Anda. Silakan coba dengan kata kunci lain.';
  }
  
  if (products.length === 1) {
    const product = products[0];
    let response = `Saya menemukan produk yang Anda cari:\n\n` +
      `**${product.name}**\n` +
      `${product.description}\n` +
      `Harga: Rp ${product.price.toLocaleString('id-ID')}\n` +
      `Kategori: ${product.category}\n`;
      
    if (product.color) {
      response += `Warna: ${product.color}\n`;
    }
    
    if (product.size) {
      response += `Ukuran: ${product.size}\n`;
    }
    
    response += `Status: ${product.inStock ? 'Tersedia' : 'Stok Habis'}`;
    
    return response;
  }
  
  // Multiple products found
  let response = `Saya menemukan ${products.length} produk yang sesuai dengan pencarian Anda:\n\n`;
  
  products.forEach((product, index) => {
    response += `${index + 1}. **${product.name}** - Rp ${product.price.toLocaleString('id-ID')} (${product.inStock ? 'Tersedia' : 'Stok Habis'})\n`;
  });
  
  response += '\nSilakan tanyakan lebih detail tentang produk yang Anda minati.';
  
  return response;
};

/**
 * Format order information from external API for chat response
 */
export const formatExternalOrderResponse = (order: ApiOrder | null): string => {
  if (!order) {
    return 'Maaf, saya tidak dapat menemukan pesanan dengan ID tersebut. Mohon periksa kembali nomor pesanan Anda.';
  }
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusInIndonesian = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Menunggu Pembayaran',
      'processing': 'Sedang Diproses',
      'shipped': 'Dalam Pengiriman',
      'delivered': 'Telah Diterima',
      'cancelled': 'Dibatalkan'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  let response = `Informasi Pesanan **${order.id}**:\n\n`;
  response += `Status: **${getStatusInIndonesian(order.status)}**\n`;
  response += `Tanggal Pemesanan: ${formatDate(order.createdAt)}\n`;
  
  if (order.trackingNumber && order.status.toLowerCase() === 'shipped') {
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
 * Format user status information for chat response
 */
export const formatUserStatusResponse = (user: ApiUser | null): string => {
  if (!user) {
    return 'Maaf, saya tidak dapat menemukan informasi pengguna. Mohon pastikan Anda sudah login.';
  }
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  let response = `Informasi Keanggotaan **${user.name}**:\n\n`;
  response += `Level Keanggotaan: **${user.membershipLevel}**\n`;
  response += `Poin: ${user.membershipPoints} poin\n`;
  response += `Terdaftar sejak: ${formatDate(user.registeredSince)}\n\n`;
  
  // Add membership benefits based on level
  switch (user.membershipLevel.toLowerCase()) {
    case 'bronze':
      response += 'Manfaat Keanggotaan Bronze:\n- Diskon 5% untuk setiap pembelian\n- Akses ke promo khusus member';
      break;
    case 'silver':
      response += 'Manfaat Keanggotaan Silver:\n- Diskon 10% untuk setiap pembelian\n- Akses ke promo khusus member\n- Gratis ongkir untuk pembelian di atas Rp 500.000';
      break;
    case 'gold':
      response += 'Manfaat Keanggotaan Gold:\n- Diskon 15% untuk setiap pembelian\n- Akses ke promo khusus member\n- Gratis ongkir untuk semua pembelian\n- Prioritas layanan pelanggan';
      break;
    case 'platinum':
      response += 'Manfaat Keanggotaan Platinum:\n- Diskon 20% untuk setiap pembelian\n- Akses ke promo khusus member\n- Gratis ongkir untuk semua pembelian\n- Prioritas layanan pelanggan\n- Akses ke koleksi terbatas';
      break;
    default:
      response += `Manfaat Keanggotaan ${user.membershipLevel}:\n- Silakan hubungi customer service untuk informasi lebih lanjut tentang manfaat keanggotaan Anda.`;
  }
  
  return response;
};