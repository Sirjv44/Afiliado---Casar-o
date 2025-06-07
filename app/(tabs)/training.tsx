import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Video, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';

const staticVideos = [
  {
    id: '1',
    title: 'Barras de Proteínas',
    content: 'https://youtube.com/shorts/JVNvjO-oMbw?feature=share',
    thumbnail: 'https://img.youtube.com/vi/JVNvjO-oMbw/0.jpg',
    duration: '00:30',
    category: 'Suplementos',
  },
  {
    id: '2',
    title: 'Colágeno',
    content: 'https://youtube.com/shorts/8sZ3Hhec8ZI?feature=share',
    thumbnail: 'https://img.youtube.com/vi/8sZ3Hhec8ZI/0.jpg',
    duration: '00:30',
    category: 'Beleza e Saúde',
  },
  {
    id: '3',
    title: 'Aumento de Testosterona',
    content: 'https://youtube.com/shorts/uf6gomb0crE?feature=share',
    thumbnail: 'https://img.youtube.com/vi/uf6gomb0crE/0.jpg',
    duration: '00:30',
    category: 'Hormonal',
  },
  {
    id: '4',
    title: 'Repositores',
    content: 'https://youtube.com/shorts/gC392HXOdsI?feature=share',
    thumbnail: 'https://img.youtube.com/vi/gC392HXOdsI/0.jpg',
    duration: '00:30',
    category: 'Nutrição',
  },
  {
    id: '5',
    title: 'Termogênicos',
    content: 'https://youtube.com/shorts/02VLu7mdb-Y?feature=share',
    thumbnail: 'https://img.youtube.com/vi/02VLu7mdb-Y/0.jpg',
    duration: '00:30',
    category: 'Emagrecimento',
  },
  {
    id: '6',
    title: 'Hipercalóricos',
    content: 'https://youtube.com/shorts/0OFY4I6rmYo?feature=share',
    thumbnail: 'https://img.youtube.com/vi/0OFY4I6rmYo/0.jpg',
    duration: '00:30',
    category: 'Ganho de Massa',
  },
  {
    id: '7',
    title: 'Ômega 3',
    content: 'https://youtube.com/shorts/TfKHTWj6_Zs?feature=share',
    thumbnail: 'https://img.youtube.com/vi/TfKHTWj6_Zs/0.jpg',
    duration: '00:30',
    category: 'Saúde',
  },
  {
    id: '8',
    title: 'Glutamina',
    content: 'https://youtube.com/shorts/Amo0RbtNFxU?feature=share',
    thumbnail: 'https://img.youtube.com/vi/Amo0RbtNFxU/0.jpg',
    duration: '00:30',
    category: 'Imunidade',
  },
  {
    id: '9',
    title: 'Creatina',
    content: 'https://youtube.com/shorts/xgaxTSwz8JU?feature=share',
    thumbnail: 'https://img.youtube.com/vi/xgaxTSwz8JU/0.jpg',
    duration: '00:30',
    category: 'Performance',
  },
  {
    id: '10',
    title: 'Pasta de Amendoim',
    content: 'https://youtube.com/shorts/9jb2Plogiww?feature=share',
    thumbnail: 'https://img.youtube.com/vi/9jb2Plogiww/0.jpg',
    duration: '00:30',
    category: 'Alimentação',
  },
  {
    id: '11',
    title: 'Whey Concentrado',
    content: 'https://youtube.com/shorts/PsCa7UL_I5U',
    thumbnail: 'https://img.youtube.com/vi/PsCa7UL_I5U/0.jpg',
    duration: '00:30',
    category: 'Suplementos',
  },
  {
    id: '12',
    title: 'Vitaminas e Antioxidantes',
    content: 'https://youtube.com/shorts/5IxTYrPSl0w',
    thumbnail: 'https://img.youtube.com/vi/5IxTYrPSl0w/0.jpg',
    duration: '00:30',
    category: 'Saúde',
  },
  {
    id: '13',
    title: 'Molhos',
    content: 'https://youtube.com/shorts/Be0tVxq-89s',
    thumbnail: 'https://img.youtube.com/vi/Be0tVxq-89s/0.jpg',
    duration: '00:30',
    category: 'Alimentação',
  },
  {
    id: '14',
    title: 'Whey Isolado',
    content: 'https://youtube.com/shorts/rVVsT7feKVc',
    thumbnail: 'https://img.youtube.com/vi/rVVsT7feKVc/0.jpg',
    duration: '00:30',
    category: 'Suplementos',
  },
  {
    id: '15',
    title: 'Pré-treino',
    content: 'https://youtube.com/shorts/R5Kam5JfLqc',
    thumbnail: 'https://img.youtube.com/vi/R5Kam5JfLqc/0.jpg',
    duration: '00:30',
    category: 'Performance',
  },
  {
    id: '16',
    title: 'Café Termogênico',
    content: 'https://youtube.com/shorts/tP-TCdKtRok',
    thumbnail: 'https://img.youtube.com/vi/tP-TCdKtRok/0.jpg',
    duration: '00:30',
    category: 'Emagrecimento',
  },
];

export default function TrainingListScreen() {
  const router = useRouter();

  const handlePlayVideo = (url: string) => {
    router.push({ pathname: '/videoPlayer', params: { url } });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePlayVideo(item.content)}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.details}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Video size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{item.category} • {item.duration}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Vídeos de Treinamento</Text>
      <FlatList
        data={staticVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});
