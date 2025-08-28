/**
 * ProductApi.ts
 * API service for product-related operations
 */

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
}

// Mock product database
// In a real application, this would be replaced with actual API calls
const mockProducts: Product[] = [
  {
    id: 'p001',
    name: 'Dress Batik Modern',
    description: 'Dress batik modern dengan desain elegan, cocok untuk acara formal maupun casual.',
    price: 350000,
    category: 'dress',
    imageUrl: 'https://example.com/images/dress-batik.jpg',
    inStock: true
  },
  {
    id: 'p002',
    name: 'Kemeja Pria Slim Fit',
    description: 'Kemeja pria slim fit dengan bahan berkualitas tinggi, nyaman dipakai sehari-hari.',
    price: 250000,
    category: 'kemeja',
    imageUrl: 'https://example.com/images/kemeja-slim.jpg',
    inStock: true
  },
  {
    id: 'p003',
    name: 'Celana Jeans Wanita',
    description: 'Celana jeans wanita dengan potongan high waist, memberikan tampilan yang stylish.',
    price: 280000,
    category: 'celana',
    imageUrl: 'https://example.com/images/jeans-wanita.jpg',
    inStock: true
  },
  {
    id: 'p004',
    name: 'Tas Selempang Kulit',
    description: 'Tas selempang dari bahan kulit asli, tahan lama dan elegan.',
    price: 450000,
    category: 'tas',
    imageUrl: 'https://example.com/images/tas-kulit.jpg',
    inStock: false
  },
  {
    id: 'p005',
    name: 'Sepatu Sneakers Casual',
    description: 'Sepatu sneakers casual dengan desain modern, nyaman untuk aktivitas sehari-hari.',
    price: 320000,
    category: 'sepatu',
    imageUrl: 'https://example.com/images/sneakers.jpg',
    inStock: true
  }
];

/**
 * Search products by keyword
 */
export const searchProducts = async (keyword: string): Promise<Product[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!keyword) {
    return [];
  }
  
  const lowercaseKeyword = keyword.toLowerCase();
  
  // Search in name, description, and category
  return mockProducts.filter(product => {
    return (
      product.name.toLowerCase().includes(lowercaseKeyword) ||
      product.description.toLowerCase().includes(lowercaseKeyword) ||
      product.category.toLowerCase().includes(lowercaseKeyword)
    );
  });
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return mockProducts.find(product => product.id === productId) || null;
};

/**
 * Format product information for chat response
 */
export const formatProductResponse = (products: Product[]): string => {
  if (products.length === 0) {
    return 'Maaf, saya tidak menemukan produk yang sesuai dengan pencarian Anda. Silakan coba dengan kata kunci lain.';
  }
  
  if (products.length === 1) {
    const product = products[0];
    return `Saya menemukan produk yang Anda cari:\n\n` +
      `**${product.name}**\n` +
      `${product.description}\n` +
      `Harga: Rp ${product.price.toLocaleString('id-ID')}\n` +
      `Kategori: ${product.category}\n` +
      `Status: ${product.inStock ? 'Tersedia' : 'Stok Habis'}`;
  }
  
  // Multiple products found
  let response = `Saya menemukan ${products.length} produk yang sesuai dengan pencarian Anda:\n\n`;
  
  products.forEach((product, index) => {
    response += `${index + 1}. **${product.name}** - Rp ${product.price.toLocaleString('id-ID')} (${product.inStock ? 'Tersedia' : 'Stok Habis'})\n`;
  });
  
  response += '\nSilakan tanyakan lebih detail tentang produk yang Anda minati.';
  
  return response;
};