import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Bell, ShoppingBag, Tag, TrendingUp, PackageCheck } from 'lucide-react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'product' | 'promotion' | 'general';
  date: string;
  read: boolean;
}

// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Pedido Aprovado',
    message: 'Seu pedido #003 para Pedro Santos foi aprovado pela expedição e está sendo preparado.',
    type: 'order',
    date: '1h atrás',
    read: false,
  },
  {
    id: '2',
    title: 'Novo Produto Disponível',
    message: 'Novo Hipercalórico MassaPro 3kg já está disponível no catálogo! Confira agora.',
    type: 'product',
    date: '3h atrás',
    read: false,
  },
  {
    id: '3',
    title: 'Comissão Dobrada!',
    message: 'Campanha especial: comissão dobrada na venda de Whey Protein esta semana. Aproveite!',
    type: 'promotion',
    date: '1 dia atrás',
    read: true,
  },
  {
    id: '4',
    title: 'Pedido Entregue',
    message: 'O pedido #002 para Maria Oliveira foi entregue com sucesso. Comissão confirmada!',
    type: 'order',
    date: '2 dias atrás',
    read: true,
  },
  {
    id: '5',
    title: 'Oferta Especial',
    message: 'Creatina com 15% de desconto para seus clientes. Oferta válida até domingo!',
    type: 'promotion',
    date: '3 dias atrás',
    read: true,
  },
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'order':
      return <PackageCheck size={20} color={COLORS.text} />;
    case 'product':
      return <ShoppingBag size={20} color={COLORS.text} />;
    case 'promotion':
      return <Tag size={20} color={COLORS.text} />;
    default:
      return <Bell size={20} color={COLORS.text} />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'order':
      return COLORS.info;
    case 'product':
      return COLORS.success;
    case 'promotion':
      return COLORS.accent;
    default:
      return COLORS.primary;
  }
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        item.read ? styles.readNotification : styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View 
        style={[
          styles.iconContainer, 
          { backgroundColor: getColorForType(item.type) }
        ]}
      >
        {getIconForType(item.type)}
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDate}>{item.date}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Bell size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Sem notificações</Text>
      <Text style={styles.emptyText}>
        Você não tem nenhuma notificação no momento.
      </Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {unreadCount > 0 && (
        <Text style={styles.unreadCount}>
          Você tem {unreadCount} {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  unreadCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 31, 0, 0.05)',
  },
  readNotification: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});