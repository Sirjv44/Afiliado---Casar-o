import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';

export default function VideoPlayerScreen() {
  const { url } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {url && (
        <Video
          source={{ uri: url as string }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: width * (9 / 16), // proporção 16:9
  },
});
