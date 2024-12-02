import { db } from './config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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