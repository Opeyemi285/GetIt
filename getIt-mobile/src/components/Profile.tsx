import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { getProfile } from '../api/auth';

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export default function Profile({ onBack, onLogout }: ProfileProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setUser(res.data);
      } catch (e: any) {
        if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
          setError('Connection timed out. Please try again.');
        } else if (!e.response) {
          setError('Unable to connect to server. Please try again.');
        } else {
          setError(e.response?.data?.detail || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const menuItems = [
    { icon: 'receipt-outline', label: 'My Orders', badge: '3 Active' },
    { icon: 'location-outline', label: 'Shipping Addresses' },
    { icon: 'card-outline', label: 'Payment Methods' },
    { icon: 'notifications-outline', label: 'Notifications', badge: 'New' },
    { icon: 'settings-outline', label: 'Account Settings' },
    { icon: 'help-circle-outline', label: 'Help & Support' }
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1E5A35" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <AppText style={{ color: '#C0392B' }}>{error || 'Something went wrong.'}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>My Profile</AppText>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <AppText style={styles.userName}>{fullName}</AppText>
          <AppText style={styles.userEmail}>{user.email}</AppText>
        </View>

        {/* Menu Items List */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={20} color="#1E5A35" style={styles.menuIcon} />
                  <AppText style={styles.menuLabel}>{item.label}</AppText>
                </View>
                <View style={styles.menuItemRight}>
                  {item.badge && (
                    <View style={[
                      styles.badgeContainer,
                      item.badge === 'New' ? styles.newBadge : styles.activeBadge
                    ]}>
                      <AppText style={styles.badgeText}>{item.badge}</AppText>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
                </View>
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={styles.logoutIcon} />
          <AppText style={styles.logoutText}>Log Out</AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 60,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F4',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  placeholderBtn: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3EC481',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3EC481',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#78716C',
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeContainer: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#D0F2E1',
  },
  newBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E5A35',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginHorizontal: 16,
    height: 48,
    borderRadius: 10,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});