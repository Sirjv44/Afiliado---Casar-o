import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import ProductCard, { Product } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const ITEMS_PER_PAGE = 8;
const ITEM_WIDTH = 220 + 16; // largura do item + marginHorizontal*2

export default function CatalogScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase.from('products').select('*', { count: 'exact' });

      // Filtro por busca
      if (searchText.trim() !== '') {
        query = query.or(
          `name.ilike.%${searchText}%,description.ilike.%${searchText}%`
        );
      } else {
        // Filtro por categoria
        if (selectedCategory === 'Sem Estoque') {
          query = query.eq('stock', 0);
        } else if (selectedCategory !== 'Todos') {
          query = query.gt('stock', 0).ilike('category', `%${selectedCategory}%`);
        } else {
          query = query.gt('stock', 0);
        }

        // Paginação
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Erro ao buscar produtos:', error.message);
      } else {
        setProducts(data || []);
        if (count !== null) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        } else {
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .gt('stock', 0);

      if (error) {
        console.error('Erro ao buscar categorias:', error.message);
      } else if (data) {
        const uniqueCatsSet = new Set(
          data
            .map((p) => (p.category ? p.category.trim().toLowerCase() : ''))
            .filter((c) => c !== '')
        );

        uniqueCatsSet.delete('todos');

        let uniqueCategories = Array.from(uniqueCatsSet).map(
          (c) => c.charAt(0).toUpperCase() + c.slice(1)
        );

        if (user?.admin) {
          uniqueCategories = ['Sem Estoque', ...uniqueCategories];
        }

        setCategories(['Todos', ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar categorias:', error);
    }
  };

  // Atualiza produtos com debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [selectedCategory, currentPage, searchText]);

  // Atualiza categorias
  useEffect(() => {
    fetchCategories();
  }, [user?.admin]);

  // Reset do carrossel ao mudar produtos
  useEffect(() => {
    setCarouselIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [products]);

  const handleAddToCart = (product: Product) => {
    router.push({ pathname: '/order/new', params: { id: product.id } });
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const newIndex = Math.max(0, carouselIndex - 1);
      scrollRef.current.scrollTo({
        x: newIndex * ITEM_WIDTH,
        animated: true,
      });
      setCarouselIndex(newIndex);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const newIndex = Math.min(products.length - 1, carouselIndex + 1);
      scrollRef.current.scrollTo({
        x: newIndex * ITEM_WIDTH,
        animated: true,
      });
      setCarouselIndex(newIndex);
    }
  };

  return (
    <View style={styles.container}>
      {/* Busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setCurrentPage(1);
            }}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => {
              setSelectedCategory(category);
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de produtos em carrossel */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : products.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <TouchableOpacity onPress={scrollLeft} style={styles.arrowButton}>
            <ChevronLeft size={28} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.productsRow, { paddingHorizontal: 8 }]}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
          >
            {products.map((product) => (
              <View key={product.id} style={styles.productItem}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={scrollRight} style={styles.arrowButton}>
            <ChevronRight size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noProductsContainer}>
          <Text style={styles.noProductsText}>Nenhum produto encontrado.</Text>
        </View>
      )}

      {/* Paginação (oculta somente durante busca) */}
      {searchText.trim() === '' && totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft
              size={28}
              color={currentPage === 1 ? COLORS.border : COLORS.text}
            />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Página {currentPage} de {totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight
              size={28}
              color={currentPage === totalPages ? COLORS.border : COLORS.text}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text, marginLeft: 8 },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoriesScroll: { maxHeight: 48 },
  categoriesContainer: { paddingHorizontal: 16, alignItems: 'center' },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  selectedCategory: { backgroundColor: COLORS.primary },
  categoryText: { color: COLORS.textSecondary, fontWeight: '500', fontSize: 14 },
  selectedCategoryText: { color: COLORS.text },
  carouselWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flex: 1,
    marginTop: 12,
  },
  arrowButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productItem: {
    width: 220,
    marginHorizontal: 8,
    flexShrink: 0,
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  noProductsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  paginationText: { marginHorizontal: 16, fontSize: 16, color: COLORS.text },
});
