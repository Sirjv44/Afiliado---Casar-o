import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Video, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { createClient } from '@/lib/supabase';

interface TrainingItem {
  id: string;
  title: string;
  content: string;
  thumbnail: string;
  duration: string;
  category: string;
}

export default function TrainingListScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('training_materials')
        .select('*')
        .eq('type', 'Video')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVideos(data);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  const handlePlayVideo = (url: string) => {
    router.push({ pathname: '/videoPlayer', params: { url } });
  };

  const renderItem = ({ item }: { item: TrainingItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePlayVideo(item.content)}>
      <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/100x100' }} style={styles.thumbnail} />
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>Carregando vídeos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Vídeos de Treinamento</Text>
      <FlatList
        data={videos}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
