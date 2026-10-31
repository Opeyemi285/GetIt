import React, { useState } from 'react';
import AppText from '../AppText';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface RegisterProps {
  onFinish: (firstName: string, lastName: string) => void;
  onBack: () => void;
  onLogin: () => void;
}

export default function Register({ onFinish, onBack, onLogin }: RegisterProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      setError('Please enter your last name.');
      return;
    }
    setError('');
    onFinish(firstName, lastName);
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
          Let's Get <AppText style={styles.headingAccent}>Started!</AppText>
        </AppText>

        <View style={{ marginTop: 70 }}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>First Name</AppText>
            <TextInput
              placeholder="Enter your First Name"
              style={[styles.input, error && !firstName.trim() ? styles.inputError : null]}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (error) setError('');
              }}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Last Name</AppText>
            <TextInput
              placeholder="Enter your Last Name"
              style={[styles.input, error && !lastName.trim() ? styles.inputError : null]}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (error) setError('');
              }}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <TouchableOpacity style={styles.registerBtn} onPress={handleContinue} activeOpacity={0.85}>
          <AppText style={styles.registerBtnText}>Continue</AppText>
        </TouchableOpacity>

        <AppText style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
          or
        </AppText>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
          <Image source={require('../../../assets/social-icons/facebook-icon.png')} style={styles.socialIcon} />
          <AppText style={styles.registerBtnText}>Register with Facebook</AppText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
          <Image source={require('../../../assets/social-icons/google-icon.png')} style={styles.socialIcon} />
          <AppText style={styles.registerBtnText}>Register with Google</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 24 }}>
          <AppText style={{ fontSize: 14 }}>Already have an account? </AppText>
          <TouchableOpacity onPress={onLogin}>
            <AppText style={{ fontSize: 14, color: '#4bd381' }}>Login</AppText>
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
  registerBtn: {
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
  registerBtnText: {
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