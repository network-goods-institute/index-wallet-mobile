import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';


interface EducationalSlideProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  backgroundColor?: string;
  textColor?: string;
}

const { width } = Dimensions.get('window');

export default function EducationalSlide({ 
  title, 
  description, 
  image, 
  backgroundColor = '#ffffff',
  textColor = '#000000'
}: EducationalSlideProps) {
  return (
    <View style={[styles.slide, { backgroundColor }]}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.description, { color: textColor }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});
