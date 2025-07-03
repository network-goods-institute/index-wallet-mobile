import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';

interface EducationalSlideProps {
  title: string;
  description: string;
  image: ImageSourcePropType | React.ReactElement;
  textColor?: string;
}

export default function EducationalSlide({ 
  title, 
  description, 
  image, 
  textColor = '#000000'
}: EducationalSlideProps) {
  return (
    <View className="flex-1 justify-center items-center p-5 w-full">
      <View className="w-3/5 aspect-square justify-center items-center mb-10">
        {React.isValidElement(image) ? (
          image
        ) : (
          <Image 
            source={image as ImageSourcePropType} 
            className="w-full h-full"
            resizeMode="contain" 
          />
        )}
      </View>
      <Text 
        className="text-2xl font-bold mb-2.5 text-center"
        style={{ color: textColor }}
      >
        {title}
      </Text>
      <Text 
        className="text-base text-center px-5 leading-6"
        style={{ color: textColor }}
      >
        {description}
      </Text>
    </View>
  );
}
