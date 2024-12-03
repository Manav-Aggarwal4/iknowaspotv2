import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  Share,
  Modal 
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'react-native-qrcode-svg';
import { auth, db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, shadowStyle } from '../shared/styles';

const FriendsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [username, setUsername] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // Fetch current user's friends and friend requests
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFriends(userData.friends || []);
        setFriendRequests(userData.friendRequests || []);
      }
    };
    fetchUserData();
  }, []);

  // Search for users
  const searchUsers = async () => {
    if (searchQuery.length < 3) return;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser.uid) { // Don't show current user
          results.push({ id: doc.id, ...doc.data() });
        }
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Send friend request
  const sendFriendRequest = async (recipientId) => {
    try {
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      // Add to recipient's friend requests
      await updateDoc(doc(db, 'users', recipientId), {
        friendRequests: arrayUnion({
          id: userId,
          username: userData.username,
          status: 'pending'
        })
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Accept friend request
  const handleFriendRequest = async (requesterId, accept) => {
    try {
      const userId = auth.currentUser.uid;
      if (accept) {
        // Add to both users' friends lists
        await updateDoc(doc(db, 'users', userId), {
          friends: arrayUnion(requesterId),
          friendRequests: arrayRemove(requesterId)
        });
        await updateDoc(doc(db, 'users', requesterId), {
          friends: arrayUnion(userId)
        });
      } else {
        // Remove request if declined
        await updateDoc(doc(db, 'users', userId), {
          friendRequests: arrayRemove(requesterId)
        });
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  // Add this useEffect to get user data and camera permissions
  useEffect(() => {
    const getUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUsername(userDoc.data().username);
      }
    };

    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getUserData();
    getBarCodeScannerPermissions();
  }, []);

  // Add share profile function
  const shareProfile = async () => {
    try {
      const result = await Share.share({
        message: `Join me on iknow•a•spot! My username is ${username}`,
        title: 'Join iknow•a•spot'
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Add QR code scanning handler
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanning(false);
    try {
      const scannedData = JSON.parse(data);
      if (scannedData.userId && scannedData.username) {
        await sendFriendRequest(scannedData.userId);
        alert(`Friend request sent to ${scannedData.username}!`);
      }
    } catch (error) {
      alert('Invalid QR code');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Friends</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
          />
          <TouchableOpacity onPress={searchUsers}>
            <Ionicons name="search" size={24} color="#006400" />
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userItem}>
                  <Text style={styles.username}>{item.username}</Text>
                  <TouchableOpacity 
                    onPress={() => sendFriendRequest(item.id)}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <Text style={styles.username}>{item.username}</Text>
                  <View style={styles.requestButtons}>
                    <TouchableOpacity 
                      onPress={() => handleFriendRequest(item.id, true)}
                      style={[styles.requestButton, styles.acceptButton]}
                    >
                      <Text style={styles.requestButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleFriendRequest(item.id, false)}
                      style={[styles.requestButton, styles.declineButton]}
                    >
                      <Text style={styles.requestButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Friends</Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <Text style={styles.username}>{item.username}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No friends added yet</Text>
            }
          />
        </View>

        {/* Action Buttons moved to bottom */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={shareProfile}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.actionButtonText}>Share Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowQRCode(true)}
          >
            <Ionicons name="qr-code" size={24} color="white" />
            <Text style={styles.actionButtonText}>My QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setScanning(true)}
          >
            <Ionicons name="scan" size={24} color="white" />
            <Text style={styles.actionButtonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Modal */}
        <Modal
          visible={showQRCode}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalView}>
            <View style={styles.qrContainer}>
              <Text style={styles.modalTitle}>My QR Code</Text>
              <QRCode
                value={JSON.stringify({
                  userId: auth.currentUser.uid,
                  username: username
                })}
                size={200}
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowQRCode(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Scanner Modal */}
        <Modal
          visible={scanning}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalView}>
            <View style={styles.scannerContainer}>
              <BarCodeScanner
                onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
                style={StyleSheet.absoluteFillObject}
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setScanning(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.primary,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 100, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    ...shadowStyle,
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: themeColors.primary,
    fontSize: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.primary,
    marginBottom: 15,
    paddingLeft: 5,
  },
  userItem: {
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
  username: {
    fontSize: 16,
    color: themeColors.primary,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#006400',
    padding: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  requestButton: {
    padding: 8,
    borderRadius: 5,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#006400',
  },
  declineButton: {
    backgroundColor: '#FF0000',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 14,
  },
  emptyText: {
    color: '#006400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 250, 205, 0.9)',
    borderRadius: 20,
    ...shadowStyle,
  },
  actionButton: {
    backgroundColor: themeColors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    ...shadowStyle,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qrContainer: {
    backgroundColor: themeColors.cardBackground,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    ...shadowStyle,
  },
  scannerContainer: {
    width: '80%',
    height: '50%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.primary,
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: themeColors.primary,
    padding: 12,
    borderRadius: 12,
    width: 120,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FriendsScreen; 