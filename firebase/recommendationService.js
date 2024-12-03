import { db } from './config';
import { doc, getDoc } from 'firebase/firestore';

export const getFriendRecommendations = async (userId) => {
  try {
    // Get user's friends and their own favorites
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const friendIds = userData.friends || [];
    const userFavorites = userData.favorites || [];
    const userFavoriteIds = new Set(userFavorites.map(fav => fav.id));

    // Get all friends' favorites
    const friendsFavorites = [];
    for (const friendId of friendIds) {
      const friendDoc = await getDoc(doc(db, 'users', friendId));
      const friendData = friendDoc.data();
      if (friendData.favorites) {
        // Add friend's username to each favorite
        friendsFavorites.push(...friendData.favorites.map(fav => ({
          ...fav,
          recommendedBy: friendData.username
        })));
      }
    }

    // Group spots by frequency and filter out user's existing favorites
    const recommendations = friendsFavorites.reduce((acc, spot) => {
      if (!userFavoriteIds.has(spot.id)) {
        if (!acc[spot.id]) {
          acc[spot.id] = {
            ...spot,
            frequency: 1,
            recommendedBy: [spot.recommendedBy]
          };
        } else {
          acc[spot.id].frequency += 1;
          acc[spot.id].recommendedBy.push(spot.recommendedBy);
        }
      }
      return acc;
    }, {});

    return Object.values(recommendations);
  } catch (error) {
    console.error('Error getting friend recommendations:', error);
    return [];
  }
}; 