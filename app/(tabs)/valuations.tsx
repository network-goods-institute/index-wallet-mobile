import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ValuationSlider } from '@/components/ValuationSlider';
import { useState } from 'react';

export default function ValuationsScreen() {
  const [valuation, setValuation] = useState(15);
  const [growth, setGrowth] = useState(20);
  const [margin, setMargin] = useState(30);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Valuations</ThemedText>
      
      <ThemedView style={styles.sliderContainer}>
        <ValuationSlider
          tokenName="Wikipedia"
          averageValuation={15}
          value={valuation}
          onValueChange={setValuation}
          minValue={0}
          maxValue={100}
          step={0.1}
        />
      </ThemedView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 80, 
  } as const,
  title: {
    textAlign: 'center',
    marginBottom: 30,
  } as const,
  sliderContainer: {
    marginBottom: 30,
  } as const,
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  } as const,
});
