import React, { useState } from 'react';
import AppText from '../AppText';
import { registerStart } from '../../api/auth';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface EmailProps {
  onBack: () => void;
  onContinue: (email: string) => void;
  firstName: string;
  lastName: string;
}

export default function Email({ onBack, onContinue, firstName, lastName }: EmailProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
        setError('Please enter your email address.');
        return;
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!valid) {
        setError('Please enter a valid email address.');
        return;
    }

    setLoading(true);
    try {
        await registerStart(firstName, lastName, trimmed);
        setError('');
        onContinue(trimmed);
    } catch (e: any) {
    console.log('Full error:', JSON.stringify(e.response?.data));
    console.log('Status:', e.response?.status);
    console.log('Code:', e.code);
    console.log('Message:', e.message);

    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setError('Connection timed out. Please try again.');
    } else if (!e.response) {
        setError('Unable to connect to server. Please try again.');
    } else {
        setError(e.response?.data?.detail || 'Something went wrong.');
    }
    } finally {
        setLoading(false);
    }
    };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image
            source={require('../../../assets/back-arrow.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <AppText style={styles.heading}>
          What's your <AppText style={styles.headingAccent}>Email?</AppText>
        </AppText>
        <AppText style={styles.subheading}>
          We'll send a confirmation code to verify it's you.
        </AppText>

        <View style={{ marginTop: 40 }}>
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Email Address</AppText>
            <TextInput
              placeholder="Enter your email address"
              style={[styles.input, error ? styles.inputError : null]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
            />
            {error ? (
              <View style={styles.errorBox}>
                <AppText style={styles.errorText}>{error}</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
        style={styles.continueBtn}
        onPress={handleContinue}
        activeOpacity={0.85}
        disabled={loading}
        >
            <AppText style={styles.continueBtnText}>
                {loading ? 'Sending code...' : 'Continue'}
            </AppText>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 24,
    height: 88,
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  content: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
  },
  headingAccent: {
    color: '#4bd381',
  },
  subheading: {
    fontSize: 14,
    color: '#6B7A70',
    marginTop: 8,
    lineHeight: 21,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1A12',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F1A12',
    backgroundColor: '#F9F9F9',
  },
  inputError: {
    borderColor: '#E05252',
  },
  errorBox: {
    marginTop: 8,
    backgroundColor: '#FEE9E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
  },
  continueBtn: {
    backgroundColor: '#4bd381',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#4bd381',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});