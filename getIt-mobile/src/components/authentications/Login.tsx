import React, { useState } from 'react';
import { login } from '../../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../AppText';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface LoginProps {
  onFinish: () => void;
  onBack: () => void;
  onRegister: () => void;
}

export default function Login({ onFinish, onBack, onRegister }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!validEmail) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setError('');
      onFinish();
    } catch (e: any) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;

      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setError('Connection timed out. Please check your internet and try again.');
      } else if (!e.response) {
        setError('Unable to connect to server. Please check your connection and try again.');
      } else if (status === 404) {
        setError('No account found with this email. Please register first.');
      } else if (status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header with back button */}
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
          Welcome back, <AppText style={styles.headingAccent}>Login</AppText>
        </AppText>

        <View style={{ marginTop: 70 }}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Email Address</AppText>
            <TextInput
              placeholder="Enter Email Address"
              style={[styles.input, error && !email.trim() ? styles.inputError : null]}
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Password</AppText>
            <View style={[styles.inputRow, error && !password ? styles.inputRowError : null]}>
              <TextInput
                placeholder="Enter your password"
                style={styles.inputFlex}
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(prev => !prev)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
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
          style={styles.loginBtn}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <AppText style={styles.loginBtnText}>
            {loading ? 'Logging in...' : 'Login'}
          </AppText>
        </TouchableOpacity>

        <AppText style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
          or
        </AppText>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
          <Image source={require('../../../assets/social-icons/facebook-icon.png')} style={styles.socialIcon} />
          <AppText style={styles.loginBtnText}>Login with Facebook</AppText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
          <Image source={require('../../../assets/social-icons/google-icon.png')} style={styles.socialIcon} />
          <AppText style={styles.loginBtnText}>Login with Google</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 24 }}>
          <AppText style={{ fontSize: 14 }}>Don't have an account? </AppText>
          <TouchableOpacity onPress={onRegister}>
            <AppText style={{ fontSize: 14, color: '#4bd381' }}>Register</AppText>
          </TouchableOpacity>
        </View>
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
  loginBtn: {
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
  loginBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  socialBtn: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
});