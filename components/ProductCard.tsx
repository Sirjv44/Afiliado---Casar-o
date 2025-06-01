import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { ShoppingCart, Bookmark } from 'lucide-react-native';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  image_Url: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onViewDetails(product)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: product.image_url }} style={styles.image} />

      
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{product.category}</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{product.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>
          <Text style={styles.stock}>{product.stock} em estoque</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onAddToCart(product)}
          >
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton}>
            <Bookmark size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1.2, // Ajuste este valor conforme necessário (1.5, 1.3 etc.)
    resizeMode: 'cover',
  },
  
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stock: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});