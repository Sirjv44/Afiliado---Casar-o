import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createClient } from '@/lib/supabase';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '@/constants/Colors';

export default function AffiliatePixScreen() {
  const { id } = useLocalSearchParams();
  const [payload, setPayload] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('pix_key, full_name')
        .eq('id', id)
        .single();

      if (profileError || !profileData) {
        console.error('Erro ao buscar afiliado:', profileError?.message);
        setLoading(false);
        return;
      }

      setName(profileData.full_name);

      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('affiliate_id', id)
        .ilike('status', 'pending');

      if (commissionsError) {
        console.error('Erro ao buscar comissões:', commissionsError.message);
        setLoading(false);
        return;
      }

      const pendingOnly =
        commissions?.filter((c) => c.status?.trim() === 'pending') || [];

      const totalRaw = pendingOnly.reduce((sum, item) => {
        const valor = parseFloat(item.amount);
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);

      const total = Math.round(totalRaw * 100) / 100;

      const pixPayload = gerarPixPayload(
        profileData.pix_key,
        profileData.full_name,
        'GOIANIA',
        total
      );

      setPayload(pixPayload);
      setLoading(false);
    };

    if (id) fetchData();
  }, [id]);

  async function handleMarkAsPaid() {
    const supabase = createClient();

    const { error } = await supabase
      .from('commissions')
      .update({ status: 'paid' })
      .eq('affiliate_id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('Erro ao atualizar status:', error.message);
      Alert.alert('Erro', 'Erro ao atualizar comissões.');
    } else {
      setSuccessMessage('✅ Comissões marcadas como pagas!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }

  function gerarPixPayload(chave, nome, cidade, valor) {
    function removerAcentos(str) {
      return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function format(id, value) {
      const length = value.length.toString().padStart(2, '0');
      return `${id}${length}${value}`;
    }

    function validarCPF(cpf) {
      if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
      }

      let resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9))) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
      }

      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(10))) return false;

      return true;
    }

    function formatarChavePix(chave) {
      const chaveLimpa = chave.trim();
      const apenasNumeros = chaveLimpa.replace(/\D/g, '');

      // CPF
      if (apenasNumeros.length === 11 && validarCPF(apenasNumeros)) {
        return apenasNumeros;
      }

      // Telefone
      if (/^\d{11}$/.test(apenasNumeros)) {
        return `+55${apenasNumeros}`;
      }

      // CNPJ
      if (/^\d{14}$/.test(apenasNumeros)) {
        return apenasNumeros;
      }

      // E-mail
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chaveLimpa)) {
        return chaveLimpa;
      }

      // Chave aleatória
      if (chaveLimpa.length >= 32) {
        return chaveLimpa;
      }

      // Fallback
      return chaveLimpa;
    }

    const chaveFormatada = formatarChavePix(chave);
    const nomeLimpo = removerAcentos(nome).trim().substring(0, 25);
    const cidadeLimpa = removerAcentos(cidade).trim().substring(0, 15);
    const valorFormatado = valor.toFixed(2);

    const gui = format('00', 'br.gov.bcb.pix');
    const key = format('01', chaveFormatada);
    const merchantAccount = format('26', gui + key);

    const payloadSemCRC =
      '000201' +
      merchantAccount +
      '52040000' +
      '5303986' +
      format('54', valorFormatado) +
      format('58', 'BR') +
      format('59', nomeLimpo) +
      format('60', cidadeLimpa) +
      format('62', format('05', '***')) +
      '6304';

    const crc = calcularCRC16(payloadSemCRC);
    return payloadSemCRC + crc;
  }

  function calcularCRC16(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code PIX para {name}</Text>

      {successMessage !== '' && (
        <Text style={styles.successMessage}>{successMessage}</Text>
      )}

      {payload ? (
        <>
          <QRCode
            value={payload}
            size={256}
            backgroundColor="#FFFFFF"
            color="#000000"
            quietZone={10}
          />
          <Text style={styles.payloadText}>{payload}</Text>

          <TouchableOpacity style={styles.button} onPress={handleMarkAsPaid}>
            <Text style={styles.buttonText}>Marcar como pago</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.error}>Erro ao gerar QR Code</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.text,
  },
  successMessage: {
    color: 'green',
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  payloadText: {
    marginTop: 20,
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
});
