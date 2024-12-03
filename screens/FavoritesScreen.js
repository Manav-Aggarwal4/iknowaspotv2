import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Linking, Platform } from 'react-native';
import { auth, db } from '../firebase/config';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, shadowStyle } from '../shared/styles';

const openInMaps = (place) => {
  const { latitude, longitude } = place.coordinate;
  const label = encodeURIComponent(place.name);
  const url = Platform.select({
    ios: `maps://app?saddr=Current%20Location&daddr=${latitude},${longitude}&q=${label}`,
    android: `google.navigation:q=${latitude},${longitude}`
  });

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(browserUrl);
    }
  });
};

const FavoritesList = ({ title, data, type }) => {
  if (data.length === 0) return null;

  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.favoriteItem}>
            <View style={styles.textContainer}>
              <Text style={styles.spotName}>{item.name}</Text>
              <TouchableOpacity onPress={() => openInMaps(item)}>
                <Text style={styles.addressText}>
                  📍 Directions
                </Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="heart" size={24} color="#006400" />
          </View>
        )}
      />
    </View>
  );
};

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [friendsFavorites, setFriendsFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser.uid;
    
    // Fetch user's favorites
    const unsubscribe = onSnapshot(doc(db, 'users', userId), async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFavorites(userData.favorites || []);
        
        // Fetch friends' favorites
        if (userData.friends && userData.friends.length > 0) {
          const friendsData = await Promise.all(
            userData.friends.map(async (friendId) => {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                return {
                  username: friendDoc.data().username,
                  favorites: friendDoc.data().favorites || []
                };
              }
              return null;
            })
          );
          
          // Filter out null values and empty favorites
          const validFriendsData = friendsData
            .filter(friend => friend && friend.favorites.length > 0)
            .map(friend => ({
              ...friend,
              favorites: friend.favorites.map(fav => ({
                ...fav,
                friendName: friend.username // Add friend's name to each favorite
              }))
            }));
            
          setFriendsFavorites(validFriendsData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const restaurants = favorites.filter(place => 
    place.type === 'restaurant'
  );

  const scenicSpots = favorites.filter(place => 
    place.type === 'scenic'
  );

  // Add this new component for friends' favorites
  const FriendsFavoritesList = ({ data }) => {
    // Even if no data, we'll still render the section with a message
    return (
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Friends' Favorite Spots</Text>
        {(!data || data.length === 0) ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends added yet</Text>
            <Text style={styles.subEmptyText}>
              Add friends to see their favorite spots!
            </Text>
          </View>
        ) : (
          <FlatList
            data={data.flatMap(friend => 
              friend.favorites.map(fav => ({
                ...fav,
                friendName: friend.username
              }))
            )}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.favoriteItem}>
                <View style={styles.textContainer}>
                  <Text style={styles.spotName}>{item.name}</Text>
                  <Text style={styles.friendName}>Added by {item.friendName}</Text>
                  <TouchableOpacity onPress={() => openInMaps(item)}>
                    <Text style={styles.addressText}>
                      📍 Directions
                    </Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="heart" size={24} color="#006400" />
              </View>
            )}
          />
        )}
      </View>
    );
  };

  // Update the return statement
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Favorite Spots</Text>
        <FavoritesList 
          title="Favorite Restaurants" 
          data={restaurants}
          type="restaurant"
        />
        <FavoritesList 
          title="Favorite Activities" 
          data={scenicSpots}
          type="scenic"
        />
        <FriendsFavoritesList data={friendsFavorites} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.primary,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 100, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: themeColors.primary,
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 5,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: themeColors.cardBackground,
    borderRadius: 15,
    marginBottom: 12,
    ...shadowStyle,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  spotName: {
    fontSize: 16,
    color: themeColors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: themeColors.primary,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  friendName: {
    fontSize: 12,
    color: themeColors.subText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    margin: 10,
    ...shadowStyle,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subEmptyText: {
    fontSize: 14,
    color: themeColors.primary,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default FavoritesScreen; 