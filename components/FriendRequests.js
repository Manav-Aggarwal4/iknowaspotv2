import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function FriendRequests({ requests, onUpdate }) {
  const auth = getAuth();
  const db = getFirestore();

  const handleRequest = async (requesterId, accept) => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const requesterRef = doc(db, 'users', requesterId);

      if (accept) {
        // Add as friend for both users
        await updateDoc(userRef, {
          friends: arrayUnion(requesterId),
          friendRequests: arrayRemove(requesterId)
        });
        await updateDoc(requesterRef, {
          friends: arrayUnion(auth.currentUser.uid)
        });
      } else {
        // Remove request
        await updateDoc(userRef, {
          friendRequests: arrayRemove(requesterId)
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  return (
    <View style={styles.container}>
      {requests.map((request) => (
        <View key={request.id} style={styles.requestItem}>
          <Text style={styles.requestText}>{request.displayName}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleRequest(request.id, true)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.declineButton]}
              onPress={() => handleRequest(request.id, false)}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... Add appropriate styles
}); 