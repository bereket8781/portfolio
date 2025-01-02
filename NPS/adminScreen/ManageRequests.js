import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchRequests, updateRequestStatus, deleteRequest } from '../services/requestService';
import { useNavigation } from '@react-navigation/native';

const ManageRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const result = await fetchRequests();
        if (result.success) {
          setRequests(result.requests.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          Alert.alert('Error', result.msg || 'Failed to load requests.');
        }
      } catch (error) {
        console.error('Error loading requests:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    const result = newStatus === 'Declined' ? await deleteRequest(id) : await updateRequestStatus(id, { status: newStatus });
    if (result.success) {
      Alert.alert('Success', `Request ${newStatus}.`);
      setRequests(prev => prev.filter(req => req.id !== id));
    } else {
      Alert.alert('Error', result.msg || 'Failed to update request status.');
    }
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const handleChat = async (userId, userName) => {
    try {
      // Optionally, initiate the chat (e.g., create a message thread in Firestore if not already present)
      navigation.navigate('AdminChatScreen', { userId, userName });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };


  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestText}>Name: {item.firstName} {item.lastName}</Text>
      <Text style={styles.requestText}>Sex: {item.sex}</Text>
      <Text style={styles.requestText}>Time: {new Date(item.time).toLocaleTimeString()}</Text>
      <Text style={styles.requestText}>Birthdate: {new Date(item.birthdate).toDateString()}</Text>    
      <Text style={styles.requestText}>Type: {item.paymentType}</Text>
      <Text style={styles.requestText}>Social Media Link: {item.socialMediaLink || 'N/A'}</Text>
      <Text style={styles.requestText}>Notes: {item.notes || 'No Notes Provided'}</Text>
      <Text style={styles.statusText}>Status: {item.status || 'Pending'}</Text>
      {item.screenshot && (
        <TouchableOpacity onPress={() => handleImagePress(item.screenshot)}>
          <Image source={{ uri: item.screenshot }} style={styles.screenshot} />
        </TouchableOpacity>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={() => handleChat(item.userId, `${item.firstName} ${item.lastName}`)}
        >
          <Icon name="chat" size={24} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleUpdateStatus(item.id, 'Approved')}
        >
          <Icon name="check-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => handleUpdateStatus(item.id, 'Declined')}
        >
          <Icon name="cancel" size={24} color="#fff" />
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading Requests...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No requests available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContainer}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6200ea',
  },
  listContainer: {
    padding: 15,
  },
  requestItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  requestText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 10,
  },
  screenshot: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    width: '30%',
    justifyContent: 'center',
  },
  chatButton: {
    backgroundColor: '#007aff',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ManageRequestsScreen;
