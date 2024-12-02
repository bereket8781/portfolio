import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { lightTheme } from './Theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const ProfileScreen = () => {
  const theme = lightTheme;
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [lastBookingStatus, setLastBookingStatus] = useState('Loading...');
  const [lastRequestStatus, setLastRequestStatus] = useState('Loading...');

  useEffect(() => {
    const fetchLastInquiries = async () => {
      if (!user) {
        console.error('User not logged in');
        setLastBookingStatus('No user logged in');
        setLastRequestStatus('No user logged in');
        return;
      }
  
      try {
        console.log('Fetching bookings for user:', user.uid);
  
        // Fetch last booking
        const bookingQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const bookingSnapshot = await getDocs(bookingQuery);
  
        if (!bookingSnapshot.empty) {
          const lastBooking = bookingSnapshot.docs[0].data();
          console.log('Last booking:', lastBooking);
          setLastBookingStatus(lastBooking.status || 'Pending');
        } else {
          console.warn('No bookings found for user:', user.uid);
          setLastBookingStatus('No bookings found');
        }
  
        console.log('Fetching requests for user:', user.uid);
  
        // Fetch last request
        const requestQuery = query(
          collection(db, 'requests'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const requestSnapshot = await getDocs(requestQuery);
  
        if (!requestSnapshot.empty) {
          const lastRequest = requestSnapshot.docs[0].data();
          console.log('Last request:', lastRequest);
          setLastRequestStatus(lastRequest.status || 'Pending');
        } else {
          console.warn('No requests found for user:', user.uid);
          setLastRequestStatus('No requests found');
        }
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        setLastBookingStatus('Error fetching booking status');
        setLastRequestStatus('Error fetching request status');
      }
    };
  
    fetchLastInquiries();
  }, [user]);
  

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      {user ? (
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Icon name="person" size={28} color={theme.primary} />
            <Text style={styles.info}>{user.username || 'Unknown User'}</Text>
          </View>

          <View style={styles.card}>
            <Icon name="email" size={28} color={theme.primary} />
            <Text style={styles.info}>{user.email}</Text>
          </View>

          {/* Last Booking Status */}
          <View style={styles.card}>
            <Icon name="event" size={28} color={theme.primary} />
            <Text style={styles.info}>Last Booking Status: {lastBookingStatus}</Text>
          </View>

          {/* Last Request Status */}
          <View style={styles.card}>
            <Icon name="request-quote" size={28} color={theme.primary} />
            <Text style={styles.info}>Last Request Status: {lastRequestStatus}</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Confirm Logout',
                'Are you sure you want to log out?',
                [
                  {
                    text: 'Cancel',
                    onPress: () => console.log('Logout cancelled'),
                    style: 'cancel',
                  },
                  {
                    text: 'Yes',
                    onPress: async () => {
                      try {
                        await logout();
                        navigation.replace('Login');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to log out. Please try again.');
                      }
                    },
                  },
                ],
                { cancelable: false }
              );
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading user data...</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 10,
    flex: 1,
  },
  cardContainer: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.secondary,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  info: {
    fontSize: 18,
    color: lightTheme.text,
    fontWeight: '500',
    marginLeft: 10,
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: lightTheme.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: lightTheme.text,
  },
});

export default ProfileScreen;
