import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import StatusCard from '@/components/StatusCard';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag,
  Database,
  CreditCard,
  LogOut,
  Users,
  Settings,
  Bookmark,
} from 'lucide-react-native';
import { createClient } from '@/lib/supabase';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingCommission: 0,
    totalCommission: 0,
  });

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePromoClick = async (productId: string) => {
    const supabase = createClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error('Erro ao buscar produto da promoção:', error);
      return;
    }

    router.push({
      pathname: '/order/new',
      params: { id: product.id },
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        if (!user?.id) return;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .eq('affiliate_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        const totalSales =
          orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, status')
          .eq('affiliate_id', user.id);

        let totalCommission = 0;
        let pendingCommission = 0;

        commissions?.forEach((c) => {
          totalCommission += c.amount || 0;
          if (c.status === 'pending') pendingCommission += c.amount || 0;
        });

        setStats({
          totalSales,
          totalOrders,
          pendingCommission,
          totalCommission,
        });

        const { data: sales } = await supabase
          .from('order_items')
          .select(
            `
            id,
            created_at,
            product:products(name),
            order:orders!inner(
              affiliate_id,
              profiles(full_name)
            )
          `
          )
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentSales(sales || []);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, [router, user]);

  const promoProducts = [
    {
      id: 'f880483a-1b7c-47b1-8f22-740f361a0828',
      image: require('@/assets/images/ataque1.jpeg'),
    },
    {
      id: 'f880483a-1b7c-47b1-8f22-740f361a0828',
      image: require('@/assets/images/ataque2.jpeg'),
    },
    {
      id: 'f880483a-1b7c-47b1-8f22-740f361a0828',
      image: require('@/assets/images/ataque3.jpeg'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1547248/pexels-photo-1547248.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.headerBackground}
        />
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
          <Text style={styles.nameText}>{user?.fullName || 'Afiliado'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>

        <View style={styles.statsContainer}>
          <StatusCard
            title="Vendas no Mês"
            value={`R$ ${stats.totalSales.toFixed(2)}`}
            subtitle={`${stats.totalOrders} pedidos realizados`}
            color={COLORS.cardAlt}
          />
          <StatusCard
            title="Comissão Pendente"
            value={`R$ ${stats.pendingCommission.toFixed(2)}`}
            subtitle="Aguardando pagamento"
            color={COLORS.cardAlt}
          />
          <StatusCard
            title="Comissão Total"
            value={`R$ ${stats.totalCommission.toFixed(2)}`}
            subtitle="Desde o início"
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <View style={styles.actionsContainer}>
          <ActionButton
            title="Fazer Novo Pedido"
            onPress={() => router.push('/order/new')}
            icon={<ShoppingBag size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Ver Catálogo"
            onPress={() => router.push('/(tabs)/catalog')}
            icon={<Database size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Favoritos"
            onPress={() => router.push('/Favoritos')}
            icon={<Bookmark size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Minhas Comissões"
            onPress={() => router.push('/(tabs)/commissions')}
            icon={<CreditCard size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Sair da Conta"
            onPress={handleLogout}
            loading={isLoading}
            primary={false}
            icon={<LogOut size={20} color={COLORS.primary} />}
          />
        </View>

        {user?.admin && (
          <>
            <Text style={styles.sectionTitle}>Administração</Text>
            <View style={styles.actionsContainer}>
              <ActionButton
                title="Lista de Afiliados"
                onPress={() => router.push('/admin/Afiliados')}
                icon={<Users size={20} color="#FFFFFF" />}
              />
              <ActionButton
                title="Alterar Produtos"
                onPress={() => router.push('/admin/AlterarProdutos')}
                icon={<Settings size={20} color="#FFFFFF" />}
              />
              <ActionButton
                title="Alterar Pedidos"
                onPress={() => router.push('/admin/AlterarPedidos')}
                icon={<Settings size={20} color="#FFFFFF" />}
              />
              <ActionButton
                title="Alterar Cadastros"
                onPress={() => router.push('/admin/Usuarios')}
                icon={<Users size={20} color="#FFFFFF" />}
              />
            </View>
          </>
        )}

        <View style={styles.promotionContainer}>
          <Text style={styles.promotionTitle}>Promoção da Semana!</Text>
          <Text style={styles.promotionText}>
            Combo Viper de R$ 349,00 por 249,90
          </Text>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
          >
            {promoProducts.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={() => handlePromoClick(item.id)}>
                <Image
                  source={item.image}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {recentSales.length > 0 && (
          <View style={styles.salesFeed}>
            <Text style={styles.sectionTitle}>Últimas Vendas</Text>
            {recentSales.map((sale, index) => (
              <Text key={index} style={styles.saleText}>
                {sale.order?.profiles?.full_name} acabou de vender{' '}
                {sale.product?.name}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 180,
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  welcomeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  nameText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  promotionContainer: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  promotionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  carousel: {
    marginTop: 16,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselImage: {
    width: Dimensions.get('window').width - 280,
    height: 180,
    borderRadius: 12,
    marginRight: 10,
  },
  salesFeed: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  saleText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
});
