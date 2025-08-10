import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
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
  BarChart,
  FileText,
} from 'lucide-react-native';
import { createClient } from '@/lib/supabase';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [ofertasSemana, setOfertasSemana] = useState([]);
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

  const handleDownloadCatalogWeb = async () => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('name, price, image_url');

    if (error || !products || products.length === 0) {
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Catálogo de Produtos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
            .product { 
              border: 1px solid #ccc; 
              padding: 10px; 
              border-radius: 8px; 
              width: 200px; 
              text-align: center;
            }
            .product img { width: 150px; height: 150px; object-fit: cover; }
            .product-name { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .product-price { color: green; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Catálogo de Produtos</h1>
          <div class="grid">
            ${products.map(p => `
              <div class="product">
                <img src="${p.image_url}" />
                <div class="product-name">${p.name}</div>
                <div class="product-price">R$ ${p.price.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    // Criar blob e abrir nova aba
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

  } catch (err) {
    console.error(err);
    Alert.alert('Erro', 'Ocorreu um problema ao gerar o catálogo.');
  }
};

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        if (!user?.id) return;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Resumo financeiro
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

        // Buscar todas as promoções ativas
        const today = new Date().toISOString().split('T')[0];

        const { data: offers } = await supabase
          .from('weekly_offers')
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today)
          .order('start_date', { ascending: false });

        if (offers?.length) {
          const ofertasComImagens = await Promise.all(
            offers.map(async (offer) => {
              const { data: imagesData } = await supabase
                .from('weekly_offer_images')
                .select('image_url')
                .eq('offer_id', offer.id)
                .order('display_order', { ascending: true });

              return {
                id: offer.id,
                title: offer.title,
                description: offer.description,
                product_id: offer.product_id,
                images: imagesData?.map((img) => img.image_url) || [],
              };
            })
          );
          setOfertasSemana(ofertasComImagens);
        } else {
          setOfertasSemana([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, [router, user]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1547248/pexels-photo-1547248.jpeg',
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
            title="Meu Desempenho"
            onPress={() => router.push('/dashboard/eu')}
            icon={<BarChart size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Ver Extrato"
            onPress={() => router.push('/dashboard/extrato')}
            icon={<FileText size={20} color="#FFFFFF" />}
          />
          <ActionButton
            title="Ranking"
            onPress={() => router.push('/dashboard/gamificacao')}
            icon={<BarChart size={20} color="#FFFFFF" />}
          />

          {/* Botão Baixar Catálogo */}
<TouchableOpacity
  style={[styles.button, { backgroundColor: COLORS.secondary, marginTop: 10 }]}
  onPress={handleDownloadCatalogWeb}
>
  <Text style={styles.buttonText}>BAIXAR CATÁLOGO</Text>
</TouchableOpacity>

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
                title="Dashboard Admin"
                onPress={() => router.push('/admin/AdminDashboard')}
                icon={<BarChart size={20} color="#FFFFFF" />}
              />
              <ActionButton
                title="Gestão de Pagamentos"
                onPress={() => router.push('/admin/pagamentos')}
                icon={<CreditCard size={20} color="#FFFFFF" />}
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
              <ActionButton
                title="Ofertas da Semana"
                onPress={() => router.push('/admin/ListagemOfertas')}
                icon={<Bookmark size={20} color="#FFFFFF" />}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Promoções da Semana!</Text>

        {ofertasSemana.length > 0 ? (
          ofertasSemana.map((oferta, index) => (
            <View key={index} style={styles.promotionContainer}>
              <Text style={styles.promotionTitle}>{oferta.title}</Text>
              <Text style={styles.promotionText}>{oferta.description}</Text>

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.carousel}
              >
                {oferta.images.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() =>
                      router.push({
                        pathname: '/order/new',
                        params: { id: oferta.product_id },
                      })
                    }
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))
        ) : (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
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
});
