import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { auth, db } from '../firebase/config';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, shadowStyle } from '../shared/styles';
import { toggleFavorite, getUserData } from '../firebase/userService';

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

const FavoritesList = ({ title, data, type, setFavorites }) => {
  const handleUnfavorite = async (itemId) => {
    try {
      const userId = auth.currentUser.uid;
      const favoriteItem = {
        id: itemId
      };
      
      await toggleFavorite(userId, favoriteItem);
      setFavorites(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite');
    }
  };

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
              
              {item.type === 'restaurant' && item.favoriteDish && (
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant" size={16} color={themeColors.primary} />
                  <Text style={styles.detailText}>Must try: {item.favoriteDish}</Text>
                </View>
              )}
              
              {item.bestTimeToGo && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={themeColors.primary} />
                  <Text style={styles.detailText}>Best time: {item.bestTimeToGo}</Text>
                </View>
              )}
              
              {item.personalNotes && (
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle" size={16} color={themeColors.primary} />
                  <Text style={styles.detailText}>Notes: {item.personalNotes}</Text>
                </View>
              )}

              <TouchableOpacity onPress={() => openInMaps(item)}>
                <Text style={styles.addressText}>
                  📍 Directions
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Remove Favorite',
                  'Are you sure you want to remove this from your favorites?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Remove',
                      onPress: () => handleUnfavorite(item.id),
                      style: 'destructive',
                    },
                  ]
                );
              }}
            >
              <Ionicons 
                name="heart" 
                size={24} 
                color={themeColors.primary}
                style={styles.heartIcon}
              />
            </TouchableOpacity>
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
                  
                  {item.type === 'restaurant' && item.favoriteDish && (
                    <View style={styles.detailRow}>
                      <Ionicons name="restaurant" size={16} color={themeColors.primary} />
                      <Text style={styles.detailText}>Must try: {item.favoriteDish}</Text>
                    </View>
                  )}
                  
                  {item.bestTimeToGo && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={themeColors.primary} />
                      <Text style={styles.detailText}>Best time: {item.bestTimeToGo}</Text>
                    </View>
                  )}
                  
                  {item.personalNotes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="information-circle" size={16} color={themeColors.primary} />
                      <Text style={styles.detailText}>Notes: {item.personalNotes}</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => openInMaps(item)}>
                    <Text style={styles.addressText}>
                      📍 Directions
                    </Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="heart" size={24} color={themeColors.primary} />
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
          setFavorites={setFavorites}
        />
        <FavoritesList 
          title="Favorite Activities" 
          data={scenicSpots}
          type="scenic"
          setFavorites={setFavorites}
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: themeColors.primary,
    flex: 1,
    flexWrap: 'wrap',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    ...shadowStyle,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: themeColors.primary,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.primary,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: themeColors.primary,
  },
  cancelButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  heartIcon: {
    padding: 8, // Makes touch target bigger
  },
});

export default FavoritesScreen; 