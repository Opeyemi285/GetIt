import React, { useRef, useState } from 'react';
import AppText from './AppText';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';

interface OnboardingProps {
  onRegister: () => void;
  onLogin: () => void;
}

const slides = [
  {
    key: '1',
    title: 'Fast, Secure, and\nStress-Free Delivery',
    description: 'Get anything you need delivered from local stores and markets, right to your doorstep.',
    image: require('../../assets/onboarding-images/onboarding-delivery.png'),
  },
  {
    key: '2',
    title: 'Verified Runners',
    description: 'Our runners are thoroughly vetted and background-checked, ensuring safe and reliable delivery experience every time.',
    image: require('../../assets/onboarding-images/onboarding-people.png'),
  },
  {
    key: '3',
    title: 'Order from Any\nStore',
    description: 'Get anything you need delivered from local stores and markets, right to your doorstep.',
    image: require('../../assets/onboarding-images/onboarding-bags.png'),
  },
];

export default function Onboarding({ onRegister, onLogin }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current; // drives the dots
  const busy = useRef(false);

  const changeSlide = (next: number) => {
    if (busy.current || next === currentIndex) return;
    busy.current = true;

    // Animate the dots
    Animated.timing(progress, {
      toValue: next,
      duration: 300,
      useNativeDriver: false, // width and color can't use the native driver
    }).start();

    // Fade out, swap content, fade in
    Animated.timing(fade, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(next);
      Animated.timing(fade, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        busy.current = false;
      });
    });
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      changeSlide(currentIndex + 1);
    } else {
      onRegister();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      changeSlide(currentIndex - 1);
    }
  };

  const isLast = currentIndex === slides.length - 1;
  const slide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            onPress={goBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image
              source={require('../../assets/back-arrow.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {/* Fading slide */}
      <Animated.View style={[styles.slide, { opacity: fade }]}>
        <Image
          source={slide.image}
          style={styles.illustration}
          resizeMode="contain"
        />
        <AppText style={styles.title}>{slide.title}</AppText>
        <AppText style={styles.description}>{slide.description}</AppText>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => {
          const inputRange = [i - 1, i, i + 1];
          const dotWidth = progress.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });
          const dotColor = progress.interpolate({
            inputRange,
            outputRange: ['#C8E6D4', '#4bd381', '#C8E6D4'],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
            />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.nextBtn} onPress={goToNext} activeOpacity={0.85}>
          <AppText style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</AppText>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity style={styles.loginBtn} onPress={onLogin} activeOpacity={0.7}>
            <AppText style={styles.loginBtnText}>Login</AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.skipBtn} onPress={onRegister} activeOpacity={0.7}>
            <AppText style={styles.skipBtnText}>Skip</AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  illustration: {
    width: 220,
    height: 220,
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F1A12',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#6B7A70',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonsContainer: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 10,
  },
  nextBtn: {
    backgroundColor: '#4bd381',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4bd381',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  loginBtnText: {
    color: '#0F1A12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  skipBtnText: {
    color: '#6B7A70',
    fontSize: 15,
    fontWeight: '500',
  },
});