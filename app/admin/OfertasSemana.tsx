import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { createClient } from '@/lib/supabase';
import { COLORS } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { parse, isValid } from 'date-fns';

export default function NovaOferta() {
  const {
    id,
    title: paramTitle,
    description: paramDescription,
    startDate: paramStart,
    endDate: paramEnd,
  } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      setTitle(paramTitle as string);
      setDescription(paramDescription as string);
      setStartDate(paramStart as string);
      setEndDate(paramEnd as string);
      loadImages(id as string); // ✅ CORREÇÃO AQUI
    }
  }, [id]);

  const loadImages = async (offerId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('weekly_offer_images')
      .select('image_url')
      .eq('offer_id', offerId)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setImageUrls(data.map((item) => item.image_url));
    } else {
      console.error('Erro ao carregar imagens:', error);
    }
  };

  const parseDateInput = (dateStr: string) => {
    const parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
    return isValid(parsed) ? parsed : null;
  };

  const handleAddImage = () => {
    if (imageUrl.trim() !== '') {
      setImageUrls([...imageUrls, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSaveOffer = async () => {
    if (!title || !startDate || !endDate || imageUrls.length === 0) {
      alert('Preencha todos os campos e adicione ao menos uma imagem.');
      return;
    }

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);

    if (!start || !end) {
      alert('Formato de data inválido. Use dd-MM-yyyy');
      return;
    }

    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];

    try {
      setLoading(true);
      const supabase = createClient();
      let offerIdToUse = id;

      if (id) {
        const { error: updateError } = await supabase
          .from('weekly_offers')
          .update({
            title,
            description,
            start_date: formattedStart,
            end_date: formattedEnd,
          })
          .eq('id', id);

        if (updateError) {
          console.error('Erro ao atualizar oferta:', updateError);
          alert('Erro ao atualizar a oferta');
          return;
        }

        await supabase.from('weekly_offer_images').delete().eq('offer_id', id);
      } else {
        const { data: offer, error: offerError } = await supabase
          .from('weekly_offers')
          .insert({
            title,
            description,
            start_date: formattedStart,
            end_date: formattedEnd,
          })
          .select()
          .single();

        if (offerError || !offer?.id) {
          console.error('Erro ao criar oferta:', offerError);
          alert('Erro ao salvar a nova oferta');
          return;
        }

        offerIdToUse = offer.id;
      }

      const imagesToInsert = imageUrls.map((url, index) => ({
        offer_id: offerIdToUse,
        image_url: url,
        display_order: index,
      }));

      const { error: imageError } = await supabase
        .from('weekly_offer_images')
        .insert(imagesToInsert);

      if (imageError) {
        console.error('Erro ao salvar imagens:', imageError);
        alert('Erro ao salvar imagens.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.back();
      }, 3000);
    } catch (error) {
      console.error('Erro geral:', error);
      alert('Erro inesperado ao salvar a oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {success && (
        <View style={styles.successOverlay}>
          <Text style={styles.successMessage}>✅ Oferta salva com sucesso!</Text>
        </View>
      )}

      <Text style={styles.label}>Título</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Digite o título da oferta"
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Digite a descrição da oferta"
      />

      <Text style={styles.label}>Data de Início (DD-MM-YYYY)</Text>
      <TextInputMask
        type={'datetime'}
        options={{ format: 'DD-MM-YYYY' }}
        value={startDate}
        onChangeText={setStartDate}
        style={styles.input}
      />

      <Text style={styles.label}>Data de Fim (DD-MM-YYYY)</Text>
      <TextInputMask
        type={'datetime'}
        options={{ format: 'DD-MM-YYYY' }}
        value={endDate}
        onChangeText={setEndDate}
        style={styles.input}
      />

      <Text style={styles.label}>URL da Imagem</Text>
      <TextInput
        value={imageUrl}
        onChangeText={setImageUrl}
        style={styles.input}
        placeholder="Cole a URL da imagem aqui"
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
        <Text style={styles.addButtonText}>Adicionar Imagem</Text>
      </TouchableOpacity>

      <FlatList
        data={imageUrls}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.imageItemContainer}>
            <Text style={styles.imageItem}>{index + 1}. {item}</Text>
            <TouchableOpacity
              onPress={() => {
                const updated = imageUrls.filter((_, i) => i !== index);
                setImageUrls(updated);
              }}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.5 }]}
        onPress={handleSaveOffer}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Salvando...' : id ? 'Atualizar Oferta' : 'Salvar Oferta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  successOverlay: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    backgroundColor: '#d1fae5',
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
    color: '#065f46',
    textAlign: 'center',
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  imageItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  imageItem: {
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
