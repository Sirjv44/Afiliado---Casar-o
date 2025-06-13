import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';

export default function AdminPedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const exibirMensagem = (mensagem) => {
    setFeedbackMessage(mensagem);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles(full_name)`)
      .order('created_at', { ascending: false });

    if (!error) setPedidos(data);
    setLoading(false);
  };

  const traduzirStatus = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'delivered': return 'Entregue';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({ status: novoStatus }).eq('id', id);

    if (error) {
      exibirMensagem('❌ Erro ao atualizar o status.');
    } else {
      exibirMensagem(`✅ Status atualizado para ${traduzirStatus(novoStatus)}`);
      fetchPedidos();
    }
  };

  const excluirPedido = async (id) => {
    const supabase = createClient();

    const { error: erroComissoes } = await supabase.from('commissions').delete().eq('order_id', id);
    if (erroComissoes) return exibirMensagem('❌ Erro ao excluir comissões.');

    const { error: erroItens } = await supabase.from('order_items').delete().eq('order_id', id);
    if (erroItens) return exibirMensagem('❌ Erro ao excluir itens do pedido.');

    const { error: erroPedido } = await supabase.from('orders').delete().eq('id', id);
    if (erroPedido) return exibirMensagem('❌ Erro ao excluir o pedido.');

    exibirMensagem('✅ Pedido excluído com sucesso!');
    fetchPedidos();
  };

  const pedidosFiltrados = pedidos.filter((pedido) =>
    pedido.client_name?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin - Pedidos</Text>

      {showFeedback && (
        <View style={styles.feedbackOverlay}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Buscar por nome do cliente"
        value={busca}
        onChangeText={setBusca}
        placeholderTextColor={COLORS.textSecondary}
      />

      {loading ? (
        <Text style={styles.loading}>Carregando pedidos...</Text>
      ) : pedidosFiltrados.length === 0 ? (
        <Text style={styles.loading}>Nenhum pedido encontrado.</Text>
      ) : (
        pedidosFiltrados.map((pedido) => (
          <View key={pedido.id} style={styles.card}>
            <Text style={styles.text}>
              <Text style={styles.label}>Nome do Cliente:</Text> {pedido.client_name || 'Desconhecido'}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Status:</Text> {traduzirStatus(pedido.status)}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Criado em:</Text>{' '}
              {new Date(pedido.created_at).toLocaleString()}
            </Text>

            <View style={styles.statusRow}>
              <TouchableOpacity
                onPress={() => atualizarStatus(pedido.id, 'delivered')}
                style={styles.statusButton}
              >
                <Text style={styles.statusText}>Marcar Entregue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => atualizarStatus(pedido.id, 'canceled')}
                style={styles.statusButton}
              >
                <Text style={styles.statusText}>Marcar Cancelado</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => excluirPedido(pedido.id)}
            >
              <Text style={styles.buttonText}>Excluir Pedido</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.input,
    padding: 10,
    borderRadius: 8,
    color: COLORS.text,
    marginBottom: 16,
  },
  loading: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: COLORS.text,
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedbackOverlay: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});