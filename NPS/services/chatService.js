import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Fetches messages between the user and admin in real-time.
 * Ensures only one listener is active.
 * 
 * @param {string} userId - ID of the user.
 * @param {function} setMessages - State setter for messages.
 * @param {function} setUnsubscribe - Function to set the unsubscribe handler.
 * @returns {function} Unsubscribe function for real-time updates.
 */
export const fetchMessages = (userId, setMessages, setUnsubscribe) => {
  // Define the query to load messages
  const messagesQuery = query(
    collection(db, 'messages'),
    where('senderId', 'in', [userId, 'admin']),
    where('recipientId', 'in', [userId, 'admin']),
    orderBy('timestamp', 'asc')
  );

  // Start listening to query updates
  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const fetchedMessages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Fetched Messages:', fetchedMessages);  // Debugging output
    setMessages(fetchedMessages);
  });

  // Save the unsubscribe function to stop listening when needed
  setUnsubscribe(() => unsubscribe);

  return unsubscribe;  // Return the unsubscribe function
};

/**
 * Sends a message (text and optional image) from the user to the admin.
 * 
 * @param {string} userId - ID of the user.
 * @param {string} message - The message text.
 * @param {string} [imageUrl] - Optional image URL.
 * @returns {Promise<boolean>} True if successful, false if an error occurred.
 */
export const sendMessage = async (userId, message, imageUrl = '') => {
  try {
    // Prevent sending if there's no message or image
    if (!message.trim() && !imageUrl) {
      console.error('Cannot send an empty message.');
      return false;
    }

    // Add a new document in collection "messages"
    await addDoc(collection(db, 'messages'), {
      senderId: userId,
      recipientId: 'admin',
      message: message || '',  // Use empty string if no message text
      imageUrl: imageUrl || '',  // Use empty string if no image URL
      timestamp: Timestamp.now(),
    });

    return true;  // Return true if message sending is successful
  } catch (error) {
    console.error('Error sending message:', error);  // Log the error
    return false;  // Return false if there was an error
  }
};
