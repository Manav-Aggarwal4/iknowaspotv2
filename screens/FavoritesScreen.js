import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { auth, db } from '../firebase/config';
import { onSnapshot, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser.uid;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        setFavorites(doc.data().favorites || []);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.text}>No favorites yet!</Text>
          <Text style={styles.subText}>Heart your favorite spots on the map to see them here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Favorite Spots</Text>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.favoriteItem}>
              <View style={styles.textContainer}>
                <Text style={styles.spotName}>{item.name}</Text>
                {item.address && (
                  <Text style={styles.addressText}>{item.address}</Text>
                )}
              </View>
              <Ionicons name="heart" size={24} color="#006400" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFACD',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60, // Add extra padding at the top
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006400',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 20,
    color: '#006400',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#006400',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  spotName: {
    fontSize: 16,
    color: '#006400',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  }
});

export default FavoritesScreen; 