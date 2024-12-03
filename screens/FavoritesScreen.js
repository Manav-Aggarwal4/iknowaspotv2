import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/config';
import { getUserData, toggleFavorite, updateSpotNotes } from '../firebase/userService';
import { getFriendRecommendations } from '../firebase/recommendationService';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_WIDTH = width - (CARD_PADDING * 2);

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await getUserData(auth.currentUser.uid);
      setFavorites(userData?.favorites || []);
      const recs = await getFriendRecommendations(auth.currentUser.uid);
      setRecommendations(recs || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setFavorites([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (item) => {
    Alert.alert(
      "Remove Favorite",
      `Are you sure you want to remove "${item.name}" from your favorites?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: async () => {
            try {
              const updatedFavorites = favorites.filter(fav => fav.id !== item.id);
              setFavorites(updatedFavorites);
              await toggleFavorite(auth.currentUser.uid, item);
              loadData();
            } catch (error) {
              console.error('Error toggling favorite:', error);
              loadData();
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const handleNotesPress = (spot) => {
    setSelectedSpot(spot);
    setNotes(spot.notes || '');
    setIsModalVisible(true);
  };

  const handleSaveNotes = async () => {
    try {
      const updatedFavorites = await updateSpotNotes(
        auth.currentUser.uid,
        selectedSpot.id,
        notes,
        'additional'
      );
      setFavorites(updatedFavorites);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDirections = async (item) => {
    try {
      const url = `maps://?q=${item.name}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Cannot open Apple Maps",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert(
        "Error",
        "Something went wrong opening directions",
        [{ text: "OK" }]
      );
    }
  };

  const renderSpotCard = (item, isRecommendation = false) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.spotName} numberOfLines={1}>
            {item.name}
          </Text>
          {!isRecommendation && (
            <TouchableOpacity 
              onPress={() => handleToggleFavorite(item)}
              style={styles.heartButton}
            >
              <Ionicons name="heart" size={24} color="#006400" />
            </TouchableOpacity>
          )}
        </View>

        {item.favoriteDish && (
          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={16} color="#006400" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Must try: </Text>
              {item.favoriteDish}
            </Text>
          </View>
        )}

        {item.bestTimeToGo && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#006400" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Best time: </Text>
              {item.bestTimeToGo}
            </Text>
          </View>
        )}

        {item.personalNotes && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#006400" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Personal Notes: </Text>
              {item.personalNotes}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.infoRow}>
            <Ionicons name="create-outline" size={16} color="#006400" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Additional Notes: </Text>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDirections(item)}
          >
            <Ionicons name="navigate" size={18} color="white" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
          
          {!isRecommendation && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.notesButton]}
              onPress={() => handleNotesPress(item)}
            >
              <Ionicons name="create-outline" size={18} color="#006400" />
              <Text style={[styles.actionButtonText, styles.notesButtonText]}>
                Add Notes
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spots</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons 
            name={activeTab === 'favorites' ? 'heart' : 'heart-outline'} 
            size={20} 
            color={activeTab === 'favorites' ? 'white' : '#006400'} 
          />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            Your Picks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Ionicons 
            name={activeTab === 'recommendations' ? 'people' : 'people-outline'} 
            size={20} 
            color={activeTab === 'recommendations' ? 'white' : '#006400'} 
          />
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Friend Picks
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text>Loading...</Text>
          </View>
        ) : activeTab === 'favorites' ? (
          favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color="#006400" />
              <Text style={styles.emptyText}>
                No favorites yet!{'\n'}Add some from the map.
              </Text>
            </View>
          ) : (
            favorites.map(item => renderSpotCard(item, false))
          )
        ) : (
          recommendations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#006400" />
              <Text style={styles.emptyText}>
                No recommendations yet!{'\n'}Add more friends to see their picks.
              </Text>
            </View>
          ) : (
            recommendations.map(item => renderSpotCard(item, true))
          )
        )}
      </ScrollView>
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Notes</Text>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Add your notes here..."
              value={notes}
              onChangeText={setNotes}
              maxLength={200}
            />
            
            <TouchableOpacity 
              style={styles.saveNotesButton}
              onPress={handleSaveNotes}
            >
              <Text style={styles.saveNotesText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006400',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#006400',
  },
  tabText: {
    color: '#006400',
    fontWeight: '600',
    fontSize: 15,
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: CARD_PADDING,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#006400',
    flex: 1,
    marginRight: 8,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendCount: {
    color: '#006400',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
    gap: 8,
  },
  infoText: {
    color: '#444',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#006400',
  },
  notesContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  notesText: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 28,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006400',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#006400',
  },
  saveButtonText: {
    color: '#006400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  heartButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#006400',
  },
  closeButton: {
    padding: 4,
  },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveNotesButton: {
    backgroundColor: '#006400',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveNotesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FavoritesScreen; 