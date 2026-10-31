import React, { useEffect, useRef, useState } from 'react';
import AppText from './AppText';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onGetStarted: () => void;
}

export default function Splash({ onGetStarted }: SplashProps) {
  const [currentState, setCurrentState] = useState<1 | 2 | 3>(1);

  const bagOpacity = useRef(new Animated.Value(0.15)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current; // start fully invisible
  const bagScale = useRef(new Animated.Value(0.95)).current;

  const [isAutoAnimating, setIsAutoAnimating] = useState(true);

  const easeInOut = Easing.bezier(0.4, 0, 0.2, 1); // Material-style smooth curve

  const transitionToState = (stateNum: 1 | 2 | 3, duration = 800) => {
    setCurrentState(stateNum);

    if (stateNum === 1) {
      Animated.parallel([
        Animated.timing(bagOpacity, {
          toValue: 0.15,
          duration,
          easing: easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration,
          easing: easeInOut,
          useNativeDriver: true,
        }),
        Animated.spring(bagScale, {
          toValue: 0.95,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

    } else if (stateNum === 2) {
      // Bag fades in first, then button hint follows with a delay
      Animated.parallel([
        Animated.timing(bagOpacity, {
          toValue: 1.0,
          duration,
          easing: easeInOut,
          useNativeDriver: true,
        }),
        Animated.spring(bagScale, {
          toValue: 1.02,
          friction: 6,
          tension: 38,
          useNativeDriver: true,
        }),
      ]).start();

      // Button creeps in slightly after bag, very gently
      Animated.sequence([
        Animated.delay(duration * 0.5),
        Animated.timing(buttonOpacity, {
          toValue: 0.2,
          duration: duration * 1.2,
          easing: easeInOut,
          useNativeDriver: true,
        }),
      ]).start();

    } else if (stateNum === 3) {
      Animated.parallel([
        Animated.timing(bagOpacity, {
          toValue: 1.0,
          duration,
          easing: easeInOut,
          useNativeDriver: true,
        }),
        Animated.spring(bagScale, {
          toValue: 1.0,
          friction: 7,
          tension: 42,
          useNativeDriver: true,
        }),
      ]).start();

      // Button eases in smoothly — starts from wherever it is, goes to full
      Animated.sequence([
        Animated.delay(duration * 0.3),
        Animated.timing(buttonOpacity, {
          toValue: 1.0,
          duration: duration * 1.4, // slightly longer so it doesn't snap
          easing: Easing.bezier(0.0, 0.0, 0.2, 1), // ease-out: slow finish feels natural
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  useEffect(() => {
    if (!isAutoAnimating) return;

    transitionToState(1, 0);

    const timer1 = setTimeout(() => {
      if (isAutoAnimating) transitionToState(2, 1000);
    }, 1500);

    const timer2 = setTimeout(() => {
      if (isAutoAnimating) {
        transitionToState(3, 1000);
        setIsAutoAnimating(false);
      }
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAutoAnimating]);

  const handleStateSelect = (stateNum: 1 | 2 | 3) => {
    setIsAutoAnimating(false);
    transitionToState(stateNum, 400);
  };

  const handleGetStartedPress = () => {
    if (currentState === 3) onGetStarted();
  };

  const getButtonBgColor = () => {
    if (currentState === 3) return '#4bd381';
    if (currentState === 2) return '#326e4a';
    return 'transparent';
  };

  const getButtonTextColor = () => {
    if (currentState === 3) return '#000000';
    if (currentState === 2) return '#234330';
    return 'transparent';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrapper,
            { opacity: bagOpacity, transform: [{ scale: bagScale }] }
          ]}
        >
          <Image
            source={require('../../assets/getit-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity }]}>
            <TouchableOpacity
              activeOpacity={currentState === 3 ? 0.8 : 1.0}
              onPress={handleGetStartedPress}
              disabled={currentState !== 3}
              style={[
                styles.button,
                {
                  backgroundColor: getButtonBgColor(),
                  borderWidth: currentState === 1 ? 1 : 0,
                  borderColor: '#BCEFD5',
                },
                currentState === 3 && styles.buttonShadow
              ]}
            >
              <AppText
                style={[
                  styles.buttonText,
                  {
                    color: getButtonTextColor(),
                    fontWeight: currentState === 3 ? 'bold' : 'normal',
                  }
                ]}
              >
                Get Started
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C563C',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 80,
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
  },
  logo: {
    width: '100%',
    height: height * 0.45,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});