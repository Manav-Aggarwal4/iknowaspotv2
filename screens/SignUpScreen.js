import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";
import { enableIndexedDbPersistence } from "firebase/firestore";
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
        profileImage: profileImage || '../assets/icon.png', // Use default if no image selected
        favorites: []
      });

      navigation.replace('Map');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Persistence failed');
    } else if (err.code == 'unimplemented') {
      // The current browser doesn't support persistence
      console.log('Persistence not supported');
    }
  });

  const executeWithRetry = async (operation, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  // Usage example:
  const addToFavorites = async (spotId) => {
    await executeWithRetry(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(spotId)
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backButtonContent}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/iknowaspotlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titleText}>iknow•a•spot</Text>
        </View>

        <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/icon.png')}
            style={styles.profileImage}
          />
          <Text style={styles.addPhotoText}>
            {profileImage ? 'Change Photo' : 'Add Profile Photo'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#006400"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#006400"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#006400"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFACD',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#006400',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#006400',
  },
  button: {
    backgroundColor: '#006400',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#006400',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006400',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 100, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#006400',
  },
  addPhotoText: {
    color: '#006400',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#006400',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    color: '#006400',
    fontSize: 20,
    marginRight: 5,
  },
  backButtonText: {
    color: '#006400',
    fontSize: 16,
    fontWeight: '500',
  },
});

class FirestoreErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Firestore Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with the database connection. Please refresh.</h1>;
    }

    return this.props.children;
  }
}

export default SignUpScreen; 