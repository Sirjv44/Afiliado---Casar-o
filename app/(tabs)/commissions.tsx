import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import {
  CreditCard,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react-native';
import StatusCard from '@/components/StatusCard';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

interface Commission {
  id: string;
  order_id: string;
  created_at: string;
  amount: number;
  status: 'pending' | 'paid';
  orders?: {
    client_name: string;
  };
}

export default function CommissionsScreen() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'paid' | 'pending'>(
    'all'
  );

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user?.id) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('commissions')
        .select('*, orders (client_name)')
        .eq('affiliate_id', user.id);

      if (error) {
        console.error('Erro ao buscar comissões:', error);
      } else {
        setCommissions(data);
      }
    };

    fetchCommissions();
  }, [user]);

  const totalEarned = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const filteredCommissions =
    activeFilter === 'all'
      ? commissions
      : commissions.filter((c) => c.status === activeFilter);

  const renderCommissionItem = ({ item }: { item: Commission }) => (
    <View style={styles.commissionCard}>
      <View style={styles.commissionHeader}>
        <View style={styles.commissionInfo}>
          <Text style={styles.clientName}>
            {item.orders?.client_name || 'Cliente desconhecido'}
          </Text>
          <Text style={styles.orderId}>Pedido #{item.order_id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'paid' ? COLORS.success : COLORS.warning,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === 'paid' ? 'Pago' : 'Pendente'}
          </Text>
        </View>
      </View>
      <View style={styles.commissionDetails}>
        <View style={styles.detailItem}>
          <Calendar size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.amountLabel}>Comissão:</Text>
          <Text style={styles.amountValue}>R$ {item.amount.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  const handleDownloadPDF = async () => {
    try {
      const header =
        '<tr><th>Cliente</th><th>Pedido</th><th>Data</th><th>Comissão</th><th>Status</th></tr>';
      const rows = commissions
        .map(
          (c) => `
        <tr>
          <td>${c.orders?.client_name || 'Desconhecido'}</td>
          <td>${c.order_id}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td>R$ ${c.amount.toFixed(2)}</td>
          <td>${c.status === 'paid' ? 'Pago' : 'Pendente'}</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
              th { background: #eee; }
            </style>
          </head>
          <body>
            <h1>Histórico de Comissões</h1>
            <table>${header + rows}</table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (!(await Sharing.isAvailableAsync())) {
        alert('Compartilhamento não suportado neste dispositivo');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar PDF das comissões',
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.statsSection}>
          <StatusCard
            title="Total Recebido"
            value={`R$ ${totalEarned.toFixed(2)}`}
            subtitle="Valor total acumulado"
            color={COLORS.cardAlt}
          />
          <StatusCard
            title="A Receber"
            value={`R$ ${pendingAmount.toFixed(2)}`}
            subtitle="Aguardando pagamento"
            color={COLORS.cardAlt}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Histórico de Comissões</Text>
          <View style={styles.filterButtons}>
            {['all', 'paid', 'pending'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilter,
                ]}
                onPress={() =>
                  setActiveFilter(filter as 'all' | 'paid' | 'pending')
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter === 'all'
                    ? 'Todas'
                    : filter === 'paid'
                    ? 'Pagas'
                    : 'Pendentes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.listContainer}>
          {filteredCommissions.map((commission) => (
            <View key={commission.id}>
              {renderCommissionItem({ item: commission })}
            </View>
          ))}

          {filteredCommissions.length === 0 && (
            <View style={styles.emptyContainer}>
              <CreditCard size={40} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                Nenhuma comissão{' '}
                {activeFilter !== 'all'
                  ? activeFilter === 'paid'
                    ? 'paga'
                    : 'pendente'
                  : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadPDF}
          >
            <Download size={20} color={COLORS.text} />
            <Text style={styles.actionText}>Histórico de Repasses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/charts')}
          >
            <TrendingUp size={20} color={COLORS.primary} />
            <Text style={styles.secondaryActionText}>Ver Estatísticas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsSection: { padding: 16 },
  filterSection: { padding: 16, paddingBottom: 0 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  filterButtons: { flexDirection: 'row', marginBottom: 16 },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  activeFilter: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontWeight: '500' },
  activeFilterText: { color: COLORS.text },
  listContainer: { padding: 16, paddingTop: 0 },
  commissionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commissionInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  orderId: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 16 },
  statusText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  commissionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 6 },
  amountLabel: { color: COLORS.textSecondary, fontSize: 14, marginRight: 6 },
  amountValue: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 12 },
  actionsContainer: { padding: 16, paddingTop: 0 },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
});
