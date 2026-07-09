import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../types';
import { router } from "expo-router";

interface AuthContextType {
  user: Customer | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, user: Customer) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('auth_user');

        console.log('savedToken:', savedToken);
        console.log('savedUser:', savedUser);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Session restore failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession(); // ← was missing
  }, []); // ← closing brace was missing

  const signIn = async (newToken: string, newUser: Customer) => {
    console.log('signIn called with token:', newToken);
    console.log('signIn called with user:', JSON.stringify(newUser, null, 2));

    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    const saved = await AsyncStorage.getItem('auth_user');
    console.log('verified saved user:', saved);
  };

  const signOut = async () => {
     console.log("Signing out...");
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
