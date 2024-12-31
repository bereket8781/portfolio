import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { fetchActiveUsers, fetchMessages, sendMessage } from '../services/adminChatService';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '@env';

const AdminChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadActiveUsers = async () => {
      try {
        const usersList = await fetchActiveUsers();
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };
    loadActiveUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      const unsubscribe = fetchMessages(activeUser.uid, (fetchedMessages) => {
        console.log('Fetched Messages for Admin:', fetchedMessages);
        const validatedMessages = fetchedMessages.map((msg) => ({
          ...msg,
          message: msg.message || '',
          imageUrl: msg.imageUrl || '',
        }));
        setMessages(validatedMessages);
      });
      return unsubscribe;
    }
  }, [activeUser]);

  const uploadImageToCloudinary = async (uri) => {
    console.log('Uploading to Cloudinary:', uri);
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'admin-chat-image.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Cloudinary Response:', data);
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error(data.error.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImageUri(imageUri);
      console.log('Selected Image URI:', imageUri);
    } else {
      console.warn('Image selection canceled or invalid result:', result);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !imageUri) {
      console.warn('Cannot send an empty message or image.');
      return;
    }

    setIsLoading(true);
    let uploadedImageUrl = '';

    if (imageUri) {
      try {
        uploadedImageUrl = await uploadImageToCloudinary(imageUri);
        console.log('Uploaded Image URL:', uploadedImageUrl);
      } catch (error) {
        setIsLoading(false);
        return;
      }
    }

    try {
      console.log('Adding message:', {
        senderId: 'admin',
        recipientId: activeUser.uid,
        message: message.trim(),
        imageUrl: uploadedImageUrl,
        timestamp: new Date(),
      });

      const success = await sendMessage(activeUser.uid, message.trim(), uploadedImageUrl);

      if (success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Math.random().toString(),
            senderId: 'admin',
            message: message.trim(),
            imageUrl: uploadedImageUrl,
          },
        ]);
        setMessage('');
        setImageUri(null);
      } else {
        console.error('Failed to send message.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setIsLoading(false);
    Keyboard.dismiss();
  };

  const openImage = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.senderId === 'admin' ? styles.adminBubble : styles.userBubble,
      ]}
    >
      <Image
        source={{ uri: 'https://www.bing.com/images/search?q=iamge&FORM=IQFRBA&id=983EA16A8AF79F73D42E4C906F8828AFBC811FA5' }}
        style={styles.imageStyle}
        resizeMode="cover"
      />
      {item.message && <Text style={styles.messageText}>{item.message}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (activeUser ? setActiveUser(null) : navigation.goBack())}>
          <Icon name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeUser ? `Chat with ${activeUser.username}` : 'Admin Chat'}
        </Text>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Modal>

      {!activeUser ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => setActiveUser(item)}>
              <Text style={styles.userText}>{item.username}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.userList}
        />
      ) : (
        <KeyboardAvoidingView style={styles.chatContainer} behavior="padding" keyboardVerticalOffset={80}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageContainer}
            inverted
          />
          <View style={styles.inputContainer}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.selectedImagePreview}
                onError={(e) => console.error('Preview Image load error:', imageUri, e.nativeEvent.error)}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity onPress={handlePickImage}>
              <Icon name="image" size={28} color="#007aff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, isLoading || (!message && !imageUri) ? { opacity: 0.5 } : {}]}
              onPress={handleSendMessage}
              disabled={isLoading || (!message && !imageUri)}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  userList: { padding: 10 },
  userItem: { padding: 15, backgroundColor: '#f5f5f5', marginVertical: 5, borderRadius: 8 },
  userText: { fontSize: 16, color: '#333' },
  chatContainer: { flex: 1 },
  messageContainer: { paddingHorizontal: 10, paddingVertical: 20 },
  messageBubble: { padding: 10, borderRadius: 20, marginVertical: 5, maxWidth: '80%' },
  adminBubble: { backgroundColor: '#007aff', alignSelf: 'flex-end' },
  userBubble: { backgroundColor: '#f1f1f1', alignSelf: 'flex-start' },
  messageText: { color: '#333' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  input: { flex: 1, padding: 10, borderRadius: 15, backgroundColor: '#f1f1f1' },
  selectedImagePreview: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  sendButton: { padding: 10, backgroundColor: '#007aff', borderRadius: 20 },
  sendButtonText: { color: '#fff', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '90%', height: '70%', resizeMode: 'contain' },
  closeButton: { marginTop: 20, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  closeButtonText: { color: '#007aff', fontSize: 16, fontWeight: 'bold' },
  imageStyle: { width: 150, height: 150, borderRadius: 10, marginBottom: 5 },
  errorText: { color: 'red', fontSize: 14, textAlign: 'center' },
});

export default AdminChatScreen;
