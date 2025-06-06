import React from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const { url } = useLocalSearchParams();

  const extractYouTubeId = (url: string) => {
    // Suporta: shorts, watch?v=, youtu.be
    const regex =
      /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url && typeof url === 'string' ? url.match(regex) : null;
    return match ? match[1] : null;
  };

  const videoId = extractYouTubeId(url as string);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    : null;

  if (!embedUrl) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>URL inválida</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          width={width}
          height={width * (9 / 16)}
          src={embedUrl}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={styles.iframe}
        ></iframe>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        source={{ uri: embedUrl }}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    width: width,
    height: width * (9 / 16),
  },
  iframe: {
    borderRadius: 8,
  },
});
