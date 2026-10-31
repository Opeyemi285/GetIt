import api from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerStart = (firstName: string, lastName: string, email: string) =>
  api.post('/auth/register/start', {
    first_name: firstName,
    last_name: lastName,
    email,
  });

export const verifyOTP = (email: string, code: string) =>
  api.post('/auth/register/verify', { email, code });

export const registerComplete = (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) =>
  api.post('/auth/register/complete', {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
  });

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('token', res.data.access_token);
  return res;
};
export const getProfile = async () => {
  const token = await AsyncStorage.getItem('token');
  return api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
};