import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getFirestore, collection, query, where, getDocs, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function AddFriendModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const auth = getAuth();
  const db = getFirestore();

  const sendFriendRequest = async () => {
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage('User not found');
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      if (friendDoc.id === auth.currentUser.uid) {
        setMessage('Cannot add yourself as friend');
        return;
      }

      // Add friend request
      await updateDoc(doc(db, 'users', friendDoc.id), {
        friendRequests: arrayUnion(auth.currentUser.uid)
      });

      setMessage('Friend request sent!');
      setTimeout(onClose, 1500);
    } catch (error) {
      setMessage('Error sending friend request');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter friend's email"
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.button} onPress={sendFriendRequest}>
        <Text style={styles.buttonText}>Send Friend Request</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
}); 