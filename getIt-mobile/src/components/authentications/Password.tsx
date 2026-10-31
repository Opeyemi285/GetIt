import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../AppText';
import { registerComplete } from '../../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface PasswordProps {
  onBack: () => void;
  onFinish: () => void;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Password({ onBack, onFinish, firstName, lastName, email }: PasswordProps) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password.length > 72) { setError('Password cannot be longer than 72 characters.'); return; }
    if (!confirmPassword) { setError('Please confirm your password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await registerComplete(firstName, lastName, email, password);
      await AsyncStorage.setItem('token', res.data.access_token);
      setError('');
      onFinish();
    } catch (e: any) {
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
          Create a <AppText style={styles.headingAccent}>Password</AppText>
        </AppText>
        <AppText style={styles.subheading}>
          Choose a strong password to keep your account secure.
        </AppText>

        <View style={{ marginTop: 40 }}>

          {/* Password */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Password</AppText>
            <View style={[styles.inputRow, error && !password ? styles.inputRowError : null]}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Enter your password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setPasswordVisible(v => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Confirm Password</AppText>
            <View style={[styles.inputRow, error && password !== confirmPassword ? styles.inputRowError : null]}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Re-enter your password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!confirmVisible}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setConfirmVisible(v => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={confirmVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={loading}
        >
          <AppText style={styles.continueBtnText}>
            {loading ? 'Creating account...' : 'Create Account'}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
  },
  inputRowError: {
    borderColor: '#E05252',
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#0F1A12',
  },
  eyeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  errorBox: {
    backgroundColor: '#FEE9E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
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
    marginTop: 8,
    shadowColor: '#4bd381',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});