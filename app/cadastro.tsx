import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createClient } from '@/lib/supabase';
import { COLORS } from '@/constants/Colors';

export default function UploadTrainingVideoScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoFile, setVideoFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
    if (!result.canceled) {
      const file = result.assets[0];
      setVideoFile({
        ...file,
        mimeType: file.mimeType || 'video/mp4',
      });
    }
  };

  const handleUpload = async () => {
    if (!title || !category || !duration || !videoFile) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione o vídeo.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `videos/${Date.now()}_${videoFile.name}`;

      const response = await fetch(videoFile.uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training-videos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: videoFile.mimeType || `video/${fileExt}`,
        });

      if (uploadError || !uploadData) {
        console.error('Erro no upload:', uploadError);
        Alert.alert('Erro', 'Falha ao enviar vídeo para o bucket.');
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('training-videos')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;

      if (!publicUrl) {
        Alert.alert('Erro', 'Não foi possível obter a URL pública do vídeo.');
        setLoading(false);
        return;
      }

      console.log('Salvando vídeo no banco com URL:', publicUrl);

      const { error: insertError } = await supabase.from('training_materials').insert({
        title,
        type: 'video',
        category,
        duration,
        content: publicUrl,
        thumbnail: thumbnail || '',
      });

      if (insertError) {
        console.error(insertError);
        Alert.alert('Erro', 'Erro ao salvar dados no banco.');
      } else {
        Alert.alert('Sucesso', 'Vídeo enviado e salvo com sucesso!');
        setTitle('');
        setCategory('');
        setDuration('');
        setVideoFile(null);
        setThumbnail('');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Cadastrar Vídeo de Treinamento</Text>

      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Categoria"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Duração"
        value={duration}
        onChangeText={setDuration}
      />
      <TextInput
        style={styles.input}
        placeholder="URL da Thumbnail (opcional)"
        value={thumbnail}
        onChangeText={setThumbnail}
      />

      <TouchableOpacity style={styles.button} onPress={handlePickVideo}>
        <Text style={styles.buttonText}>
          {videoFile ? 'Vídeo Selecionado' : 'Selecionar Vídeo'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }]}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
});
