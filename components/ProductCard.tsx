import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  TextInput,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { ShoppingCart, Bookmark, BookmarkCheck, Plus, Minus } from 'lucide-react-native';
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
  commission_percentage?: number | null;
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
  const [currentStock, setCurrentStock] = useState(product.stock);
  const [inputStock, setInputStock] = useState(product.stock.toString());
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const descriptionLimit = 100;
  const highCommissionKeywords = ['tribulus', 'maca peruana', 'provitalis', 'cindura', 'ioimbina', 'viper'];

  const commissionRate = useMemo(() => {
    const name = product.name.toLowerCase();
    const isHighCommission = highCommissionKeywords.some(
      (keyword) => name.startsWith(keyword) || name.includes(keyword)
    );
    const isValidPercentage =
      typeof product.commission_percentage === 'number' && !isNaN(product.commission_percentage);
    return isValidPercentage ? product.commission_percentage : isHighCommission ? 0.4 : 0.2;
  }, [product]);

  const commissionValue = useMemo(() => product.price * commissionRate, [product.price, commissionRate]);

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

      if (!error && data) setIsFavorite(true);
      else setIsFavorite(false);
    };
    checkFavorite();
  }, [product.id, user?.id]);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else alert(message);
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
      } else console.error('Erro ao favoritar:', error.message);
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ affiliated_id: user.id, product_id: product.id });
      if (!error) {
        setIsFavorite(false);
        showToast('Removido dos favoritos');
      } else console.error('Erro ao desfavoritar:', error.message);
    }
    setIsLoadingFavorite(false);
  };

  const getDescriptionText = () => {
    const description = product.description ?? '';
    if (showFullDescription || description.length <= descriptionLimit) return description;
    else return description.substring(0, descriptionLimit) + '...';
  };

  const updateStock = async (newStock: number) => {
    setIsUpdatingStock(true);
    const supabase = createClient();
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
    if (!error) {
      setCurrentStock(newStock);
      setInputStock(newStock.toString());
      showToast('Estoque atualizado');
    } else {
      console.error('Erro ao atualizar estoque:', error.message);
      showToast('Erro ao atualizar estoque');
    }
    setIsUpdatingStock(false);
  };

  const increaseStock = () => updateStock(currentStock + 1);
  const decreaseStock = () => currentStock > 0 && updateStock(currentStock - 1);
  const saveInputStock = () => {
    const newStock = parseInt(inputStock);
    if (!isNaN(newStock) && newStock >= 0) updateStock(newStock);
    else showToast('Digite um número válido');
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image_url }} style={styles.image} />
          {/* Mostrar categoria apenas para não-admin */}
          {!user?.admin && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}

          {/* Mostrar comissão apenas para não-admin */}
          {!user?.admin && (
            <View style={styles.commissionBadge}>
              <Text style={styles.commissionText}>Comissão R$ {commissionValue.toFixed(2)}</Text>
            </View>
          )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>

          {user?.admin ? (
            <View style={styles.adminStockContainer}>
              <TouchableOpacity onPress={decreaseStock} style={styles.stockButton}>
                <Minus size={16} color="#fff" />
              </TouchableOpacity>

              <TextInput
                style={styles.stockInput}
                keyboardType="number-pad"
                value={inputStock}
                onChangeText={setInputStock}
              />

              <TouchableOpacity onPress={increaseStock} style={styles.stockButton}>
                <Plus size={16} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={saveInputStock} style={styles.saveStockButton} disabled={isUpdatingStock}>
                <Text style={styles.saveStockText}>Gravar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.stock}>{currentStock} em estoque</Text>
          )}
        </View>

        {/* NÃO mostrar descrição se for admin */}
        {!user?.admin && product.description && (
          <>
            <Text style={styles.description}>{getDescriptionText()}</Text>
            {product.description.length > descriptionLimit && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.showMoreText}>{showFullDescription ? 'Mostrar menos' : 'Mostrar mais'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {!user?.admin && (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 6, // garante espaçamento entre cards no carrossel
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: 220, // define largura fixa para cada card (ajusta conforme necessário)
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.2,
  },
  image: {
    width: '100%',
    height: '100%',
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
    zIndex: 2,
  },
  categoryText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  commissionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 2,
  },
  commissionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  contentContainer: { padding: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  adminStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  stockButton: { backgroundColor: COLORS.primary, padding: 6, borderRadius: 6, marginHorizontal: 4 },
  stockInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 50,
    height: 32,
    textAlign: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
    color: COLORS.text,
  },
  saveStockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  saveStockText: { color: '#fff', fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  stock: { fontSize: 12, color: COLORS.textSecondary },
  description: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 20 },
  showMoreText: { color: COLORS.primary, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 120,
    flex: 1,
  },
  buttonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  saveButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
});
