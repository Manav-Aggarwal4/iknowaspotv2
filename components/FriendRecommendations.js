import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFriendRecommendations } from '../firebase/recommendationService';
import { auth } from '../firebase/config';
import { themeColors, shadowStyle } from '../shared/styles';

export const FriendRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const recs = await getFriendRecommendations(auth.currentUser.uid);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendation = ({ item }) => (
    <TouchableOpacity style={styles.recCard}>
      <View style={styles.recHeader}>
        <Text style={styles.spotName}>{item.name}</Text>
        <View style={styles.popularityBadge}>
          <Text style={styles.popularityText}>
            {item.frequency} friend{item.frequency > 1 ? 's' : ''} like this
          </Text>
        </View>
      </View>
      
      <Text style={styles.spotAddress}>{item.address}</Text>
      
      <View style={styles.recommendedBy}>
        <Text style={styles.recommendedText}>
          Recommended by: {item.recommendedBy.join(', ')}
        </Text>
      </View>

      {item.favoriteDish && (
        <View style={styles.dishContainer}>
          <Ionicons name="restaurant" size={16} color={themeColors.primary} />
          <Text style={styles.dishText}>Friends love: {item.favoriteDish}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend Recommendations</Text>
      <FlatList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              No recommendations yet! Add more friends to see their favorite spots.
            </Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: themeColors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: themeColors.primary,
    marginBottom: 15,
  },
  recCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...shadowStyle,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotName: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.primary,
    flex: 1,
  },
  popularityBadge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  spotAddress: {
    color: '#666',
    marginBottom: 8,
  },
  recommendedBy: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  recommendedText: {
    color: '#666',
    fontSize: 13,
  },
  dishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dishText: {
    color: themeColors.primary,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default FriendRecommendations; 