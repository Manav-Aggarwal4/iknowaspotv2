import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db, auth } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const UserProfileScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Set up real-time listener for favorites
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      setFavorites(doc.data()?.favorites || []);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Favorite Spots</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.favoriteItem}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantAddress}>{item.address}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No favorite spots yet!</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  favoriteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '500',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  }
});

export default UserProfileScreen; 