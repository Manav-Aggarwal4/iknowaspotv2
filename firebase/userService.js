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

export const toggleFavorite = async (userId, placeData) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const favorites = userData?.favorites || [];
    const isFavorite = favorites.some(fav => fav.id === placeData.id);

    await updateDoc(doc(db, 'users', userId), {
      favorites: isFavorite 
        ? arrayRemove(placeData) 
        : arrayUnion(placeData)
    });

    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}; 