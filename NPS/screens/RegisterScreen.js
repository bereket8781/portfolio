import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { lightTheme } from './Theme';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [lastName, setLastName] = useState('');  // State for last name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!email || !password || !username || !lastName) {  // Check for last name as well
      setError('All fields are required');
      return;
    }

    setLoading(true);
    const response = await register(email, password, username);  // Add last name handling as needed in your auth context
    setLoading(false);

    if (response.success) {
      Alert.alert(
        'Registration Successful',
        'A verification email has been sent to your email address. Please verify your email to activate your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),  // Redirect to Login screen
          },
        ]
      );
    } else {
      setError(response.msg || 'Registration failed');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: lightTheme.background }]}>
      <Text style={[styles.title, { color: lightTheme.text }]}>Create Your Account</Text>
      {error && <Text style={[styles.error, { color: 'red' }]}>{error}</Text>}
      <TextInput
        style={[styles.input, { backgroundColor: lightTheme.secondary, color: lightTheme.text }]}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={[styles.input, { backgroundColor: lightTheme.secondary, color: lightTheme.text }]}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: lightTheme.secondary, color: lightTheme.text }]}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput  // Last Name Input
        style={[styles.input, { backgroundColor: lightTheme.secondary, color: lightTheme.text }]}
        placeholder="Last Name"
        placeholderTextColor="#888"
        value={lastName}
        onChangeText={setLastName}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: lightTheme.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={lightTheme.secondary} />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.linkText, { color: lightTheme.text }]}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  error: {
    textAlign: 'center',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
