import { db } from './config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';

export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      email: userData.email,
      createdAt: serverTimestamp(),
      ...userData
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const updateUserData = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const toggleFavorite = async (userId, spot) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const favorites = userData.favorites || [];

    // Sanitize the spot data
    const sanitizedSpot = {
      id: spot.id,
      name: spot.name,
      favoriteDish: spot.favoriteDish || '',
      bestTimeToGo: spot.bestTimeToGo || '',
      personalNotes: spot.personalNotes || '',
      notes: spot.notes || '',
      coordinate: spot.coordinate || {
        latitude: spot.latitude || 0,
        longitude: spot.longitude || 0
      }
    };

    // Add or remove the spot
    const existingIndex = favorites.findIndex(f => f.id === spot.id);
    let updatedFavorites;

    if (existingIndex >= 0) {
      updatedFavorites = favorites.filter(f => f.id !== spot.id);
    } else {
      updatedFavorites = [...favorites, sanitizedSpot];
    }

    await updateDoc(userRef, {
      favorites: updatedFavorites
    });

    return updatedFavorites;
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    throw error;
  }
};

export const updateSpotNotes = async (userId, spotId, newNotes) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const favorites = userData.favorites || [];
    
    // Update notes for the specific spot
    const updatedFavorites = favorites.map(spot => {
      if (spot.id === spotId) {
        return {
          ...spot,
          notes: newNotes || '',  // Ensure no undefined values
          favoriteDish: spot.favoriteDish || '',
          bestTimeToGo: spot.bestTimeToGo || '',
          // Preserve all other fields
          id: spot.id,
          name: spot.name,
          latitude: spot.latitude || 0,
          longitude: spot.longitude || 0
        };
      }
      return spot;
    });
    
    // Update Firestore with sanitized data
    await updateDoc(userRef, {
      favorites: updatedFavorites
    });
    
    return updatedFavorites;
  } catch (error) {
    console.error('Error updating notes:', error);
    throw error;
  }
}; 