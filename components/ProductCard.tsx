import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ToastAndroid, Platform } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { ShoppingCart, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  category: string;
  image_url: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const descriptionLimit = 100; // limite de caracteres

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.id) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('affiliated_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [product.id, user?.id]);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      alert(message);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id || isLoadingFavorite) return;
    setIsLoadingFavorite(true);
    const supabase = createClient();

    if (!isFavorite) {
      const { error } = await supabase.from('favorites').insert({
        affiliated_id: user.id,
        product_id: product.id,
      });

      if (!error) {
        setIsFavorite(true);
        showToast('Adicionado aos favoritos');
      } else {
        console.error('Erro ao favoritar:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ affiliated_id: user.id, product_id: product.id });

      if (!error) {
        setIsFavorite(false);
        showToast('Removido dos favoritos');
      } else {
        console.error('Erro ao desfavoritar:', error.message);
      }
    }
    setIsLoadingFavorite(false);
  };

  const getDescriptionText = () => {
    const description = product.description ?? '';

    if (showFullDescription || description.length <= descriptionLimit) {
      return description;
    } else {
      return description.substring(0, descriptionLimit) + '...';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onViewDetails(product)} activeOpacity={0.9}>
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

        {product.description && (
          <>
            <Text style={styles.description}>{getDescriptionText()}</Text>
            {product.description.length > descriptionLimit && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.showMoreText}>
                  {showFullDescription ? 'Mostrar menos' : 'Mostrar mais'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(product)}>
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={toggleFavorite} disabled={isLoadingFavorite}>
            {isFavorite ? (
              <BookmarkCheck size={18} color={COLORS.primary} />
            ) : (
              <Bookmark size={18} color={COLORS.primary} />
            )}
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
    aspectRatio: 1.2,
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
    marginBottom: 8,
    lineHeight: 20,
  },
  showMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
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
