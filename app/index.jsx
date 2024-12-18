import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "..//..//gglideupd-main//config//firebaseconfig"; // Import your Firebase configuration
import { useNavigation } from '@react-navigation/native';

export default function Index() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      navigation.replace('(tabs)'); // Navigate to your main screen after login
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Text style={styles.link} onPress={() => navigation.navigate('SignupScreen')}>
        Don't have an account? Sign up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  link: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center',
  },
});
