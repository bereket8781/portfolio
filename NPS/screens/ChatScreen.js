import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { fetchMessages, sendMessage } from '../services/chatService';
import { AuthContext } from '../context/AuthContext';
import { lightTheme } from '../screens/Theme';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '@env';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';

const ChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const { user } = useContext(AuthContext);
  const userId = user?.uid || 'testUser';

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      const unsubscribeFunction = await fetchMessages(userId, (newMessages) => {
        if (setMessages && typeof setMessages === 'function') {
          const formattedMessages = newMessages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate().toISOString() || null, // Format timestamp
          }));
          setMessages(formattedMessages);
        } else {
          console.error("setMessages is not a function or undefined");
        }
      });

      const initialMessages = await fetchMessagesFromDatabase(userId);
      if (initialMessages.length === 0) {
        await sendMessage(userId, 'Welcome to the chat! How can we assist you today?', '');
      }

      return unsubscribeFunction;
    };

    const fetchMessagesFromDatabase = async (userId) => {
      try {
        const messages = await fetchMessages(userId);
        return messages || [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    };

    const unsubscribe = initializeChat();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      } else {
        console.error("Unsubscribe is not a function:", unsubscribe);
      }
    };
  }, [userId]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      console.log('Image URI:', result.assets[0].uri);
    }
  };

  const handleSendMessage = async () => {
    if (isSending || (!message.trim() && !imageUri)) return;

    setIsSending(true);
    setIsLoading(true);
    let uploadedImageUrl = '';

    if (imageUri) {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'chat-image.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();
        uploadedImageUrl = data.secure_url || '';
      } catch (error) {
        console.error('Image upload error:', error);
        setIsSending(false);
        setIsLoading(false);
        return;
      }
    }

    const success = await sendMessage(userId, message, uploadedImageUrl);
    if (success) {
      setMessage('');
      setImageUri(null);
    } else {
      console.error('Failed to send message');
    }

    setIsSending(false);
    setIsLoading(false);
    Keyboard.dismiss();
  };

  const handleImagePress = (imageUrl) => {
    setCurrentImage([{ url: imageUrl }]);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={80}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color={lightTheme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>

        <ScrollView contentContainerStyle={styles.messageContainer}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.senderId === userId
                  ? styles.userBubble
                  : msg.senderId === 'system'
                  ? styles.systemBubble
                  : styles.adminBubble,
              ]}
            >
              {msg.imageUrl && (
                <TouchableOpacity onPress={() => handleImagePress(msg.imageUrl)}>
                  <Image source={{ uri: msg.imageUrl }} style={styles.imageStyle} />
                </TouchableOpacity>
              )}
              <Text style={styles.messageText}>{msg.message}</Text>
              {msg.timestamp && (
                <Text style={styles.timestampText}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 60, height: 60, borderRadius: 10, marginRight: 10 }}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            placeholderTextColor={lightTheme.text}
          />
          <TouchableOpacity onPress={handlePickImage} style={{ marginRight: 10 }}>
            <Icon name="image" size={28} color={lightTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              isLoading || (!message && !imageUri) ? { opacity: 0.5 } : {},
            ]}
            onPress={handleSendMessage}
            disabled={isSending || isLoading || (!message && !imageUri)}
          >
            {isSending || isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        <Modal isVisible={isModalVisible} style={styles.modal}>
          <ImageViewer
            imageUrls={currentImage}
            onCancel={() => setIsModalVisible(false)}
            enableSwipeDown={true}
          />
        </Modal>
      </KeyboardAvoidingView>
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
    padding: 10,
    backgroundColor: lightTheme.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: lightTheme.text,
  },
  messageContainer: {
    flexGrow: 1,
    padding: 10,
  },
  messageBubble: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: '80%',
  },
  adminBubble: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.secondary,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: lightTheme.background,
  },
  messageText: {
    color: lightTheme.text,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: lightTheme.secondary,
    padding: 10,
    borderRadius: 15,
  },
  imageStyle: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  timestampText: {
    fontSize: 10,
    color: 'gray',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: lightTheme.secondary,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 15,
    marginRight: 5,
    color: lightTheme.text,
  },
  sendButton: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: lightTheme.primary,
  },
  sendButtonText: {
    color: '#fff',
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
  },
});

export default ChatScreen;
