import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Alert, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_PLACES_API_KEY } from '@env';

// Add this helper function before your MapScreen component
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

// Add this helper function to handle map opening
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
  const [favorites, setFavorites] = useState({});

  // Get user's location
  const getUserLocation = async () => {
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to find nearby restaurants');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      
      // Fetch restaurants near user location
      fetchNearbyPlaces(userCoords.latitude, userCoords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  // Fetch nearby places using Google Places API
  const fetchNearbyPlaces = async (latitude, longitude) => {
    try {
      // Fetch restaurants
      const restaurantResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
      );
      const restaurantData = await restaurantResponse.json();
      
      // Fetch scenic spots
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

  // Get location when component mounts
  useEffect(() => {
    getUserLocation();
  
  }, []);

  const handleFavoritePress = (place) => {
    setFavorites(prev => ({
      ...prev,
      [place.id]: !prev[place.id]
    }));
    
    console.log(`${place.name} ${favorites[place.id] ? 'removed from' : 'added to'} favorites`);
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
        {/* User Location */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="blue"
          />
        )}
        
        {/* Restaurant Markers */}
        {restaurants.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinate}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('./assets/hot-pot.png')}
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
                    style={styles.favoriteButton} 
                    onPress={() => handleFavoritePress(place)}
                  >
                    <Text style={styles.heartIcon}>{favorites[place.id] ? '♥' : '♡'}</Text>
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
                source={require('./assets/sunset.png')}
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
                    style={styles.favoriteButton} 
                    onPress={() => handleFavoritePress(place)}
                  >
                    <Text style={styles.heartIcon}>{favorites[place.id] ? '♥' : '♡'}</Text>
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
    color: '#FFD700',
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
});

export default MapScreen;
