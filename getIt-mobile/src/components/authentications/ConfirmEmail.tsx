import React, { useRef, useState } from 'react';
import { verifyOTP } from '../../api/auth';
import AppText from '../AppText';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';

interface ConfirmEmailProps {
  email: string;
  onBack: () => void;
  onConfirmed: () => void;
  onResend: () => void;
}

const CODE_LENGTH = 6;

export default function ConfirmEmail({ email, onBack, onConfirmed, onResend }: ConfirmEmailProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);
    if (error) setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const full = code.join('');
    if (full.length < CODE_LENGTH) {
        setError('Please enter the full 6-digit code.');
        return;
    }

    setLoading(true);
    try {
        await verifyOTP(email, full);
        setError('');
        onConfirmed();
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

  // Mask email for display: te***@gmail.com
  const maskedEmail = email.replace(/^(.{2})(.+)(@.+)$/, (_, a, _b, c) => `${a}***${c}`);

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
          Check your <AppText style={styles.headingAccent}>Email</AppText>
        </AppText>
        <AppText style={styles.subheading}>
          We sent a 6-digit code to{' '}
          <AppText style={styles.emailHighlight}>{maskedEmail}</AppText>.
          Enter it below to continue.
        </AppText>

        {/* Code inputs */}
        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => { inputs.current[i] = ref; }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null, error ? styles.codeInputError : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              textAlign="center"
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <TouchableOpacity
        style={styles.confirmBtn}
        onPress={handleConfirm}
        activeOpacity={0.85}
        disabled={loading}
        >
            <AppText style={styles.confirmBtnText}>
                {loading ? 'Verifying...' : 'Confirm'}
            </AppText>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <AppText style={styles.resendLabel}>Didn't receive a code? </AppText>
          <TouchableOpacity onPress={onResend} activeOpacity={0.7}>
            <AppText style={styles.resendLink}>Resend</AppText>
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
  subheading: {
    fontSize: 14,
    color: '#6B7A70',
    marginTop: 8,
    lineHeight: 21,
  },
  emailHighlight: {
    color: '#0F1A12',
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 10,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F1A12',
    backgroundColor: '#F9F9F9',
  },
  codeInputFilled: {
    borderColor: '#4bd381',
    backgroundColor: '#F0FBF4',
  },
  codeInputError: {
    borderColor: '#E05252',
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: '#FEE9E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
  },
  confirmBtn: {
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
  confirmBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendLabel: {
    fontSize: 14,
    color: '#6B7A70',
  },
  resendLink: {
    fontSize: 14,
    color: '#4bd381',
    fontWeight: '600',
  },
});