import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_PLACES_API_KEY } from '@env';

const MapScreen = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

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
      fetchNearbyRestaurants(userCoords.latitude, userCoords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  // Fetch nearby restaurants using Google Places API
  const fetchNearbyRestaurants = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        const formattedRestaurants = data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          coordinate: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating: place.rating,
          address: place.vicinity,
        }));
        
        setRestaurants(formattedRestaurants);
      } else {
        console.error('Error fetching restaurants:', data.status);
        Alert.alert('Error', 'Could not fetch nearby restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', 'Could not fetch nearby restaurants');
    }
  };

  // Get location when component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation ? {
          ...userLocation,
          latitudeDelta: 0.0922,  // Zoom level
          longitudeDelta: 0.0421,
        } : null}
      >
        {/* User's location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="blue"
          />
        )}
        
        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={restaurant.coordinate}
            title={restaurant.name}
            description={`Rating: ${restaurant.rating} - ${restaurant.address}`}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('./assets/hot-pot.png')}
                style={styles.markerImage}
              />
            </View>
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
  markerContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
});

export default MapScreen;
