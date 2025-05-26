import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { Play, Video, FileText, Award, ChevronRight } from 'lucide-react-native';

interface TrainingItem {
  id: string;
  title: string;
  type: 'video' | 'text';
  duration: string;
  category: string;
  thumbnail?: string;
}

// Mock data for training materials
const mockTrainingItems: TrainingItem[] = [
  {
    id: '1',
    title: 'Como vender Whey Protein e aumentar seu lucro',
    type: 'video',
    duration: '5:30',
    category: 'Técnicas de Venda',
    thumbnail: 'https://images.pexels.com/photos/7991671/pexels-photo-7991671.jpeg',
  },
  {
    id: '2',
    title: 'Benefícios da Creatina: o que seu cliente precisa saber',
    type: 'video',
    duration: '4:15',
    category: 'Conhecimento de Produto',
    thumbnail: 'https://images.pexels.com/photos/8436784/pexels-photo-8436784.jpeg',
  },
  {
    id: '3',
    title: 'Dicas para vender suplementos pelo WhatsApp',
    type: 'text',
    duration: '3 min de leitura',
    category: 'Marketing Digital',
    thumbnail: 'https://images.pexels.com/photos/7991663/pexels-photo-7991663.jpeg',
  },
  {
    id: '4',
    title: 'Perguntas frequentes sobre Termogênicos',
    type: 'text',
    duration: '5 min de leitura',
    category: 'Conhecimento de Produto',
    thumbnail: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg',
  },
  {
    id: '5',
    title: 'Fechamento de vendas: técnicas que funcionam',
    type: 'video',
    duration: '8:45',
    category: 'Técnicas de Venda',
    thumbnail: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
  },
];

// Available categories for filtering
const categories = [
  'Todos', 
  'Técnicas de Venda', 
  'Conhecimento de Produto', 
  'Marketing Digital'
];

export default function TrainingScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredTraining = selectedCategory === 'Todos'
    ? mockTrainingItems
    : mockTrainingItems.filter(item => item.category === selectedCategory);

  const renderTrainingItem = ({ item }: { item: TrainingItem }) => (
    <TouchableOpacity style={styles.trainingCard}>
      <View style={styles.cardContent}>
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.thumbnail || 'https://images.pexels.com/photos/6740754/pexels-photo-6740754.jpeg' }}
            style={styles.thumbnail}
          />
          {item.type === 'video' && (
            <View style={styles.playButton}>
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </View>
        
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              {item.type === 'video' ? (
                <Video size={14} color={COLORS.textSecondary} />
              ) : (
                <FileText size={14} color={COLORS.textSecondary} />
              )}
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Área de Treinamento</Text>
        <Text style={styles.welcomeSubtitle}>Aprenda a vender mais e melhor</Text>
      </View>
      
      <View style={styles.featuredContainer}>
        <TouchableOpacity style={styles.featuredCard}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1552102/pexels-photo-1552102.jpeg' }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredContent}>
            <Award size={24} color="#FFFFFF" />
            <Text style={styles.featuredTitle}>Técnicas Avançadas de Vendas</Text>
            <Text style={styles.featuredSubtitle}>Curso Completo • 8 vídeos</Text>
            
            <View style={styles.featuredButton}>
              <Text style={styles.featuredButtonText}>Comece Agora</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <FlatList
        data={filteredTraining}
        renderItem={renderTrainingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  featuredCard: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredContent: {
    padding: 20,
    justifyContent: 'center',
    height: '100%',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  featuredButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    marginRight: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: COLORS.text,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  trainingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 31, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});