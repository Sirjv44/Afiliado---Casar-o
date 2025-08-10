import React, { useState, useEffect, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 5;

export default function CatalogScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .gt('stock', 0);

      if (searchText.trim() !== '') {
        // Se houver busca, ignora categoria e paginação
        query = query.or(
          `name.ilike.%${searchText}%,description.ilike.%${searchText}%`
        );
      } else {
        // Filtro por categoria (se não for "Todos")
        if (selectedCategory !== 'Todos') {
          query = query.ilike('category', `%${selectedCategory}%`);
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
          setTotalPages(
            searchText.trim() !== ''
              ? 1 // Durante busca: mostrar tudo numa página só
              : Math.ceil(count / ITEMS_PER_PAGE)
          );
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
        const uniqueCategories = [
          'Todos',
          ...Array.from(
            new Set(
              data
                .map((p) => (p.category ? p.category.trim().toLowerCase() : ''))
                .filter((c) => c !== '')
            )
          ).map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar categorias:', error);
    }
  };


  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 500); // Pequeno delay para evitar busca a cada tecla digitada

    return () => clearTimeout(delayDebounce);
  }, [selectedCategory, currentPage, searchText]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddToCart = (product: Product) => {
    router.push({ pathname: '/order/new', params: { id: product.id } });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
              setCurrentPage(1); // Sempre volta pra página 1 ao buscar
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

      {/* Lista de produtos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.productsContainer}>
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))
          ) : (
            <View style={styles.noProductsContainer}>
              <Text style={styles.noProductsText}>
                Nenhum produto encontrado.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Paginação (esconde quando estiver buscando) */}
      {searchText.trim() === '' && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity onPress={handlePrevPage} disabled={currentPage === 1}>
            <ChevronLeft
              size={28}
              color={currentPage === 1 ? COLORS.border : COLORS.text}
            />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Página {currentPage} de {totalPages}
          </Text>
          <TouchableOpacity
            onPress={handleNextPage}
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
  // ... seus estilos continuam iguais ...
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
  productsContainer: { flex: 1, padding: 16 },
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
