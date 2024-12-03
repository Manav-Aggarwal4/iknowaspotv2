import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Alert, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_PLACES_API_KEY } from '@env';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toggleFavorite, getUserData } from '../firebase/userService';

const getPriceSymbols = (level) => {
  switch(level) {
    case 0: return 'Free';
    case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return 'Price N/A';
  }
};

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

const MapScreen = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [scenicSpots, setScenicSpots] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.id === placeId);
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to find nearby restaurants');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      
      fetchNearbyPlaces(userCoords.latitude, userCoords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const getUserProfile = async () => {
    try {
      const userData = await getUserData(auth.currentUser.uid);
      if (userData) {
        setUserProfile(userData);
        setFavorites(userData.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchNearbyPlaces = async (latitude, longitude) => {
    try {
      const restaurantResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
      );
      const restaurantData = await restaurantResponse.json();
      
      const scenicResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=tourist_attraction|park|natural_feature&key=${GOOGLE_PLACES_API_KEY}`
      );
      const scenicData = await scenicResponse.json();
      
      if (restaurantData.status === 'OK') {
        const formattedRestaurants = restaurantData.results.map(place => ({
          id: place.place_id,
          name: place.name,
          coordinate: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          address: place.vicinity,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.open_now,
          types: place.types,
          waitTime: Math.floor(Math.random() * 45) + 5,
        }));
        setRestaurants(formattedRestaurants);
      }

      if (scenicData.status === 'OK') {
        const formattedScenic = scenicData.results.map(place => ({
          id: place.place_id,
          name: place.name,
          coordinate: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          address: place.vicinity,
        }));
        setScenicSpots(formattedScenic);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  useEffect(() => {
    getUserLocation();
    getUserProfile();
  }, []);

  const handleFavoritePress = async (place) => {
    try {
      const userId = auth.currentUser.uid;
      const favoriteItem = {
        id: place.place_id || place.id,
        name: place.name || 'Unnamed Location',
        type: place.types ? place.types[0] : 'place',
        address: place.vicinity || place.formatted_address || 'No address available',
        coordinate: {
          latitude: place.geometry?.location?.lat || place.coordinate?.latitude,
          longitude: place.geometry?.location?.lng || place.coordinate?.longitude
        }
      };
      
      console.log('Saving favorite:', favoriteItem);
      
      const newIsFavorite = await toggleFavorite(userId, favoriteItem);
      if (newIsFavorite) {
        setFavorites(prev => [...prev, favoriteItem]);
      } else {
        setFavorites(prev => prev.filter(item => item.id !== favoriteItem.id));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation ? {
          ...userLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : null}
      >
        {/* User Location with Profile Picture */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
          >
            <View style={styles.userMarkerContainer}>
              <Image
                source={
                  userProfile?.profileImage 
                    ? { uri: userProfile.profileImage }
                    : require('../assets/icon.png')
                }
                style={styles.userMarkerImage}
              />
            </View>
          </Marker>
        )}
        
        {/* Restaurant Markers */}
        {restaurants.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinate}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('../assets/hot-pot.png')}
                style={styles.markerImage}
              />
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.placeName}>{place.name}</Text>
                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <Text>⭐</Text>
                    <Text style={styles.placeInfo}>{place.rating}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text>💰</Text>
                    <Text style={styles.placeInfo}>{getPriceSymbols(place.priceLevel)}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text>⏳</Text>
                    <Text style={styles.placeInfo}>{place.waitTime}m</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text>{place.openNow ? '✅' : '❌'}</Text>
                    <Text style={styles.placeInfo}>{place.openNow ? 'Open' : 'Closed'}</Text>
                  </View>
                  {place.types?.filter(type => ![
                    'restaurant',
                    'food',
                    'point_of_interest',
                    'establishment'
                  ].includes(type)).length > 0 && (
                    <View style={styles.infoItem}>
                      <Text>🍽️</Text>
                      <Text style={styles.placeInfo}>{place.types
                        ?.filter(type => ![
                          'restaurant',
                          'food',
                          'point_of_interest',
                          'establishment'
                        ].includes(type))
                        .map(type => type.replace(/_/g, ' '))
                        .slice(0, 1)
                        .join(', ')}</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    onPress={() => handleFavoritePress(place)}
                    style={styles.favoriteButton}
                  >
                    <Text style={[
                      styles.heartIcon, 
                      isFavorite(place.id) && styles.activeHeart
                    ]}>
                      {isFavorite(place.id) ? '♥' : '♡'}
                    </Text>
                    <Text style={styles.favoriteText}>Favorite?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.addressContainer}
                  onPress={() => openInMaps(place)}
                >
                  <Text style={[styles.placeInfo, styles.addressText]}>
                    📍 {place.address}
                  </Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Scenic Spot Markers */}
        {scenicSpots.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinate}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('../assets/sunset.png')}
                style={styles.markerImage}
              />
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.placeName}>{place.name}</Text>
                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <Text>⭐</Text>
                    <Text style={styles.placeInfo}>{place.rating}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text>👥</Text>
                    <Text style={styles.placeInfo}>{place.userRatingsTotal} reviews</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleFavoritePress(place)}
                    style={styles.favoriteButton}
                  >
                    <Text style={[
                      styles.heartIcon, 
                      isFavorite(place.id) && styles.activeHeart
                    ]}>
                      {isFavorite(place.id) ? '♥' : '♡'}
                    </Text>
                    <Text style={styles.favoriteText}>Favorite?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.addressContainer}
                  onPress={() => openInMaps(place)}
                >
                  <Text style={[styles.placeInfo, styles.addressText]}>
                    📍 {place.address}
                  </Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 340,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#006400',
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    color: 'white',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  placeInfo: {
    fontSize: 13,
    color: 'white',
  },
  addressContainer: {
    marginTop: 2,
  },
  addressText: {
    textDecorationLine: 'underline',
    color: '#ADD8E6',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heartIcon: {
    fontSize: 16,
    color: 'white',
  },
  favoriteText: {
    fontSize: 13,
    color: '#FFD700',
  },
  markerContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  userMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#006400',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMarkerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  activeHeart: {
    color: '#FFD700',
  }
});

export default MapScreen;
