import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TransactScreen() {
  const { colorScheme } = useTheme();
  const { keyPair } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionType, setTransactionType] = useState<'send' | 'request'>('send');

  const handleTransact = () => {
    if (!recipient) {
      Alert.alert('Error', 'Please enter a recipient address or username');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // In a real app, this would call your transaction API
    Alert.alert(
      'Confirm Transaction',
      `${transactionType === 'send' ? 'Send' : 'Request'} ${amount} USD to ${recipient}${note ? `\nNote: ${note}` : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Here you would call your transaction API
            Alert.alert('Success', `Transaction ${transactionType === 'send' ? 'sent' : 'requested'} successfully!`);
            // Reset form
            setRecipient('');
            setAmount('');
            setNote('');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Transact</ThemedText>
          <ThemedText style={styles.subtitle}>Send or request payments</ThemedText>
        </View>

        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              transactionType === 'send' && styles.activeSegment,
              { backgroundColor: transactionType === 'send' ? (colorScheme === 'dark' ? '#2c2c2e' : '#e5e5ea') : 'transparent' }
            ]}
            onPress={() => setTransactionType('send')}
          >
            <ThemedText style={[styles.segmentText, transactionType === 'send' && styles.activeSegmentText]}>
              Send
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              transactionType === 'request' && styles.activeSegment,
              { backgroundColor: transactionType === 'request' ? (colorScheme === 'dark' ? '#2c2c2e' : '#e5e5ea') : 'transparent' }
            ]}
            onPress={() => setTransactionType('request')}
          >
            <ThemedText style={[styles.segmentText, transactionType === 'request' && styles.activeSegmentText]}>
              Request
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Recipient</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colorScheme === 'dark' ? '#ffffff' : '#000000', borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#d1d1d6' }
              ]}
              placeholder="Address or username"
              placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#8e8e93'}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Amount (USD)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colorScheme === 'dark' ? '#ffffff' : '#000000', borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#d1d1d6' }
              ]}
              placeholder="0.00"
              placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#8e8e93'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Note (Optional)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.noteInput,
                { color: colorScheme === 'dark' ? '#ffffff' : '#000000', borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#d1d1d6' }
              ]}
              placeholder="What's this for?"
              placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#8e8e93'}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colorScheme === 'dark' ? '#0a84ff' : '#007aff' }]}
            onPress={handleTransact}
          >
            <ThemedText style={styles.buttonText}>
              {transactionType === 'send' ? 'Send Payment' : 'Request Payment'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.recentContainer}>
          <ThemedText style={styles.recentTitle}>Recent Transactions</ThemedText>
          <View style={styles.emptyState}>
            <IconSymbol name="clock.arrow.circlepath" size={40} color={colorScheme === 'dark' ? '#8e8e93' : '#8e8e93'} />
            <ThemedText style={styles.emptyText}>No recent transactions</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  subtitle: {
    fontSize: 17,
    opacity: 0.6,
    fontFamily: 'SF-Pro-Display',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
  },
  activeSegment: {
    borderRadius: 8,
  },
  activeSegmentText: {
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'SF-Pro-Display-Medium',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Display-Bold',
  },
  recentContainer: {
    marginBottom: 30,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.6,
    fontFamily: 'SF-Pro-Display',
  },
});
