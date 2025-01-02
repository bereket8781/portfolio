import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import { fetchBookings, updateBooking, deleteBooking } from '../services/bookingService';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ManageBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await fetchBookings();
      if (result.success) {
        setBookings(result.bookings);
      } else {
        Alert.alert('Error', result.msg || 'Failed to load bookings.');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (newStatus === 'declined') {
      const result = await deleteBooking(id);
      if (result.success) {
        Alert.alert('Success', 'Booking declined and removed.');
        setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== id));
      } else {
        Alert.alert('Error', result.msg || 'Failed to decline booking.');
      }
    } else {
      const result = await updateBooking(id, { status: newStatus });
      if (result.success) {
        Alert.alert('Success', `Booking ${newStatus}.`);
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === id ? { ...booking, status: newStatus } : booking
          )
        );
      } else {
        Alert.alert('Error', result.msg || 'Failed to update booking status.');
      }
    }
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const handleChat = (userId, userName) => {
    navigation.navigate('AdminChatScreen', { userId, userName });
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.bookingText}>First Name: {item.firstName}</Text>
      <Text style={styles.bookingText}>Middle Name: {item.MiddleName}</Text>
      <Text style={styles.bookingText}>Last Name: {item.lastName}</Text>
      <Text style={styles.bookingText}>Sex: {item.sex}</Text>
      <Text style={styles.bookingText}>Birthdate: {new Date(item.birthdate).toDateString()}</Text>
      <Text style={styles.bookingText}>Payment Type: {item.paymentType}</Text>
      <Text style={styles.bookingText}>Notes: {item.notes}</Text>
      <Text style={styles.bookingText}>Social Media Link: {item.socialMediaLink}</Text>
      {item.screenshot && (
        <TouchableOpacity onPress={() => handleImagePress(item.screenshot)}>
          <Image source={{ uri: item.screenshot }} style={styles.screenshot} />
        </TouchableOpacity>
      )}
      <Text style={styles.statusText}>Status: {item.status || 'Pending'}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={() => handleChat(item.userId, `${item.firstName} ${item.lastName}`)}
        >
          <Icon name="chat" size={24} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleUpdateStatus(item.id, 'accepted')}
        >
          <Icon name="check-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => handleUpdateStatus(item.id, 'declined')}
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
        <Text style={styles.loadingText}>Loading Bookings...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No bookings available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
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
    padding: 10,
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
  bookingItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },
  bookingText: {
    fontSize: 16,
    color: '#333',
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
  acceptButton: {
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
    marginTop: 20,
    backgroundColor: '#6200ea',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ManageBookingsScreen;
