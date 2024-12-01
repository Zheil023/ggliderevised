import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import { auth } from '@/config/firebaseconfig'; // Firebase auth import
import { onAuthStateChanged } from 'firebase/auth'; // to check auth state

interface SelectedItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  quantity: number;
}

export default function ListScreen() {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // Store the user's UID
  const navigation = useNavigation();

  // Fetch selected items from Firestore in real-time
  const fetchSelectedItems = () => {
    if (!userId) return;

    const q = query(collection(db, 'users', userId, 'selectedItems'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        quantity: doc.data().quantity || 1,
      }));

      // Aggregate items with the same name
      const aggregatedItems = items.reduce((acc, item) => {
        if (acc[item.name]) {
          acc[item.name].quantity += 1;
        } else {
          acc[item.name] = { ...item, quantity: 1 };
        }
        return acc;
      }, {} as { [key: string]: SelectedItem });

      // Set the state with aggregated items
      setSelectedItems(Object.values(aggregatedItems));
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set user ID after authentication
        fetchSelectedItems(); // Fetch user's selected items from Firestore
      } else {
        setUserId(null); // No user is logged in
        setSelectedItems([]); // Clear the selected items list
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  const handleStartNavigation = () => {
    Alert.alert(
      "Start Navigation", 
      "Are you sure you want to start navigation?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Navigation cancelled"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            // Pass selected categories to the map screen
            const selectedCategories = [...new Set(selectedItems.map(item => item.category))];
            navigation.navigate('map', { selectedCategories });
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleRemoveItem = async (itemId: string, itemName: string, quantity: number) => {
    if (quantity > 1) {
      // If more than one item, update the quantity
      await updateDoc(doc(db, 'users', userId!, 'selectedItems', itemId), {
        quantity: quantity - 1,
      });
      setSelectedItems((prevItems) =>
        prevItems.map((item) =>
          item.name === itemName
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ).filter((item) => item.quantity > 0)
      );
      Alert.alert("Item Removed", `${itemName} has been removed from your list.`);
    } else {
      // If quantity is 1, remove the item completely
      await deleteDoc(doc(db, 'users', userId!, 'selectedItems', itemId));
      setSelectedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      Alert.alert("Item Removed", `${itemName} has been removed from your list.`);
    }
  };

  // Add a new item to the list (in case you want to add an item programmatically)
  const handleAddItem = async (newItem: SelectedItem) => {
    if (!userId) return;
    
    const itemRef = doc(collection(db, 'users', userId, 'selectedItems'));
    await setDoc(itemRef, {
      name: newItem.name,
      category: newItem.category,
      quantity: 1, // Set initial quantity to 1
      imageUrl: newItem.imageUrl,
    });

    setSelectedItems((prevItems) => [...prevItems, newItem]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selected Items</Text>
      <FlatList
        data={selectedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>
              {item.name} x{item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id, item.name, item.quantity)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity onPress={handleStartNavigation} style={styles.button}>
        <Text style={styles.buttonText}>Start Navigation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
