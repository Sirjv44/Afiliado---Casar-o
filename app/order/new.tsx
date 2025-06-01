import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { Product } from '@/components/ProductCard';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Phone,
  MapPin,
  CircleCheck as CheckCircle2,
} from 'lucide-react-native';
import { createClient } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

interface CartItem extends Product {
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const CustomerInfoForm = ({ handlePreviousStep, handleNextStep }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleCustomerInfoChange = useCallback(
    (field: keyof CustomerInfo, value: string) => {
      setCustomerInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const validateAndSubmit = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    handleNextStep(customerInfo);
  };

  return (
    <>
      <View style={styles.stepContainer}>
        <Text style={styles.formTitle}>Dados do Cliente</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <User size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor={COLORS.textSecondary}
              value={customerInfo.name}
              onChangeText={(text) => handleCustomerInfoChange('name', text)}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Phone size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              value={customerInfo.phone}
              onChangeText={(text) => handleCustomerInfoChange('phone', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <MapPin size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Endereço Completo"
              placeholderTextColor={COLORS.textSecondary}
              value={customerInfo.address}
              onChangeText={(text) => handleCustomerInfoChange('address', text)}
            />
          </View>

          <View style={styles.textareaContainer}>
            <Text style={styles.textareaLabel}>Observações:</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Instruções especiais para entrega, etc."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={customerInfo.notes}
              onChangeText={(text) => handleCustomerInfoChange('notes', text)}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={validateAndSubmit}>
          <Text style={styles.nextButtonText}>Revisar Pedido</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const OrderReview = ({
  customerInfo,
  cartItems,
  subtotal,
  handlePreviousStep,
  handleSubmitOrder,
  isLoading,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.reviewTitle}>Revise seu Pedido</Text>

    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>Dados do Cliente</Text>
      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Nome:</Text>
        <Text style={styles.reviewValue}>{customerInfo.name}</Text>
      </View>
      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Telefone:</Text>
        <Text style={styles.reviewValue}>{customerInfo.phone}</Text>
      </View>
      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Endereço:</Text>
        <Text style={styles.reviewValue}>{customerInfo.address}</Text>
      </View>
      {customerInfo.notes ? (
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Observações:</Text>
          <Text style={styles.reviewValue}>{customerInfo.notes}</Text>
        </View>
      ) : null}
    </View>

    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>Itens do Pedido</Text>
      {cartItems.map((item) => (
        <View key={item.id} style={styles.reviewProductItem}>
          <Text style={styles.reviewProductName}>{item.name}</Text>
          <View style={styles.reviewProductDetails}>
            <Text style={styles.reviewProductQuantity}>{item.quantity}x</Text>
            <Text style={styles.reviewProductPrice}>
              R$ {(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.reviewTotal}>
        <Text style={styles.reviewTotalLabel}>Total:</Text>
        <Text style={styles.reviewTotalValue}>R$ {subtotal.toFixed(2)}</Text>
      </View>
    </View>

    <View style={styles.buttonGroup}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handlePreviousStep}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.disabledButton]}
        onPress={handleSubmitOrder}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Finalizar Pedido</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

export default function NewOrderScreen() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const params = useLocalSearchParams();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (params?.id) {
      const product = {
        id: String(params.id),
        name: String(params.name),
        price: Number(params.price),
        stock: Number(params.stock),
        description: String(params.description),
        category: String(params.category),
        image_url: String(params.image_url),
        quantity: 1,
      };

      setCartItems([product]);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0); // apenas produtos com estoque maior que 0

      if (error) {
        console.error('Erro ao buscar produtos:', error.message);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const filteredProducts = useMemo(() => {
    const search = searchText.toLowerCase();
    return products.filter((product) => {
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';
  
      return (
        name.includes(search) ||
        description.includes(search) ||
        category.includes(search)
      );
    });
  }, [products, searchText]);
  
  

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, amount: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const handleNextStep = (info?: CustomerInfo) => {
    if (step === 1) {
      if (cartItems.length === 0) {
        Alert.alert(
          'Carrinho vazio',
          'Adicione pelo menos um produto ao carrinho antes de continuar.'
        );
        return;
      }
      setStep(2);
    } else if (step === 2 && info) {
      setCustomerInfo(info);
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const supabase = createClient();

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'joaovitorjvpg6@gmail.com',
      password: 'Lh442017',
    });

    if (error) {
      console.error('Erro ao logar:', error.message);
      return null;
    }

    return data.session?.user;
  };

  const handleSubmitOrder = async () => {
    const supabase = createClient();

    try {
      setIsLoading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login.');
        return;
      }

      const userId = sessionData.session.user.id;
      const { name, phone, address, notes } = customerInfo;

      // 1. Inserir pedido na tabela 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            affiliate_id: userId,
            client_name: name,
            client_phone: phone,
            client_address: address,
            notes,
            status: 'shipped',
            total_amount: subtotal,
          },
        ])
        .select('id')
        .single();

      if (orderError || !orderData?.id) throw orderError;

      const orderId = orderData.id;

      // 2. Inserir itens do pedido na tabela 'order_items'
      const itemsToInsert = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback: deletar o pedido se os itens falharem
        await supabase.from('orders').delete().eq('id', orderId);
        throw itemsError;
      }

      // 3. Atualizar o estoque dos produtos corretamente
      for (const item of cartItems) {
        const { data: productData, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError || !productData) {
          console.error(
            `Erro ao buscar estoque do produto ${item.name}:`,
            fetchError?.message
          );
          continue; // pula este produto
        }

        const newStock = productData.stock - item.quantity;

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);

        if (updateError) {
          console.error(
            `Erro ao atualizar estoque do produto ${item.name}:`,
            updateError.message
          );
        }
      }

      const commissionsToInsert = cartItems.map((item) => {
        const commissionRate = item.category === 'Emagrecimento' ? 0.4 : 0.15;
        const amount = item.price * item.quantity * commissionRate;

        return {
          order_id: orderId,
          affiliate_id: userId,
          amount,
          status: 'pending',
        };
      });

      const { error: commissionError } = await supabase
        .from('commissions')
        .insert(commissionsToInsert);

      if (commissionError) {
        console.error('Erro ao registrar comissão:', commissionError.message);
      }

      // 4. Sucesso
      Alert.alert('Pedido Realizado!', 'Seu pedido foi enviado com sucesso.');
      setOrderSuccess(true);
      setCartItems([]);
      setStep(1);
      setCustomerInfo({
        name: '',
        phone: '',
        address: '',
        notes: '',
      });
      setTimeout(() => setOrderSuccess(false), 4000);

      // Recarrega produtos com estoque atualizado
      const { data: updatedProducts, error: reloadError } = await supabase
        .from('products')
        .select('*');
      if (!reloadError) {
        setProducts(updatedProducts);
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error.message || error);
      Alert.alert(
        'Erro',
        'Falha ao enviar pedido. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ProductSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView style={styles.productList} keyboardShouldPersistTaps="handled">
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                R$ {product.price.toFixed(2)}
              </Text>
              <Text style={styles.productStock}>
                {product.stock} em estoque
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(product)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.cartSummary}>
        <View style={styles.cartHeader}>
          <View style={styles.cartIcon}>
            <ShoppingCart size={20} color={COLORS.text} />
          </View>
          <Text style={styles.cartTitle}>Carrinho</Text>
          <Text style={styles.cartItems}>
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
          </Text>
        </View>

        {cartItems.length > 0 ? (
          <View style={styles.cartContent}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    R$ {item.price.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus
                      size={16}
                      color={
                        item.quantity <= 1
                          ? COLORS.textDisabled
                          : COLORS.textSecondary
                      }
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, 1)}
                  >
                    <Plus size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromCart(item.id)}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.subtotal}>
              <Text style={styles.subtotalLabel}>Subtotal:</Text>
              <Text style={styles.subtotalValue}>R$ {subtotal.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>Seu carrinho está vazio</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          cartItems.length === 0 && styles.disabledButton,
        ]}
        onPress={() => handleNextStep()}
        disabled={cartItems.length === 0}
      >
        <Text style={styles.nextButtonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Novo Pedido',
          headerShown: true,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View style={styles.container}>
        {orderSuccess && (
          <View style={styles.successOverlay}>
            <Text style={styles.successMessage}>
              ✅ Pedido finalizado com sucesso!
            </Text>
          </View>
        )}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
          <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
          <View style={[styles.stepDot, step >= 3 && styles.activeStepDot]}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
        </View>

        <View style={styles.stepLabelContainer}>
          <Text
            style={[styles.stepLabel, step === 1 && styles.activeStepLabel]}
          >
            Produtos
          </Text>
          <Text
            style={[styles.stepLabel, step === 2 && styles.activeStepLabel]}
          >
            Cliente
          </Text>
          <Text
            style={[styles.stepLabel, step === 3 && styles.activeStepLabel]}
          >
            Confirmação
          </Text>
        </View>

        {step === 1 && <ProductSelection />}
        {step === 2 && (
          <CustomerInfoForm
            handlePreviousStep={handlePreviousStep}
            handleNextStep={handleNextStep}
          />
        )}
        {step === 3 && (
          <OrderReview
            customerInfo={customerInfo}
            cartItems={cartItems}
            subtotal={subtotal}
            handlePreviousStep={handlePreviousStep}
            handleSubmitOrder={handleSubmitOrder}
            isLoading={isLoading}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  successOverlay: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    backgroundColor: '#d1fae5', // verde claro
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    alignItems: 'center',
    zIndex: 999,
  },
  successMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46', // verde escuro
    textAlign: 'center',
    marginTop: 12,
  },
  successEmoji: {
    fontSize: 40,
  },

  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.card,
  },
  activeStepLine: {
    backgroundColor: COLORS.primary,
  },
  stepLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  stepLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  activeStepLabel: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  productList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartSummary: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 250,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  cartItems: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cartContent: {
    padding: 12,
  },
  emptyCart: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCartText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  cartItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityText: {
    color: COLORS.text,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  subtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 12,
  },
  textareaContainer: {
    marginBottom: 16,
  },
  textareaLabel: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    minHeight: 100,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  reviewSection: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewLabel: {
    width: 90,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  reviewValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  reviewProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewProductName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  reviewProductDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewProductQuantity: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  reviewProductPrice: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  reviewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
  },
  reviewTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
