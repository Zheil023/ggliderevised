import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text, Modal, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRoute } from '@react-navigation/native';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebaseconfig';

const storeLayoutImage = require('../../assets/images/store.png');

export default function MapScreen() {
  const route = useRoute();
  const { selectedCategories = [] } = route.params || {}; // Set a default empty array
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false); // Track modal visibility
  const [selectedImage, setSelectedImage] = useState(null); // Store the selected image URL
  const [showAllMarkers, setShowAllMarkers] = useState(false); // New state for showing all markers
  const [markerPositions, setMarkerPositions] = useState([]);
  const [showItemsModal, setShowItemsModal] = useState(false); // Modal to display items in the category
  const [categoryItems, setCategoryItems] = useState([]); // Store items for a specific category

  // Fetch markers in Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Markers'), (snapshot) => {
      const Markers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        location: {
          x: parseInt(doc.data().location.x, 10), // Convert to integer if needed
          y: parseInt(doc.data().location.y, 10)
        }
      }));
      setMarkerPositions(Markers);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Fetch selected items in real-time from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'SelectedItems'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group items by name and category, and sum quantities
      const groupedItems = items.reduce((acc, item) => {
        const key = `${item.name}-${item.category}`;
        if (!acc[key]) {
          acc[key] = { ...item, quantity: 1 };
        } else {
          acc[key].quantity += 1;
        }
        return acc;
      }, {});

      // Convert object to array
      setSelectedItems(Object.values(groupedItems).filter(item => selectedCategories.includes(item.category)));
    });

    return () => unsubscribe();
  }, [selectedCategories]);

  // Filter markers based on unique categories in selectedItems
  const filteredMarkers = Array.from(
    new Set(selectedItems.map(item => item.category)) // Filter unique categories
  ).map(category => markerPositions.find(marker => marker.category === category))
    .filter(Boolean); // Remove any undefined entries

  // Function to handle item removal
  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'SelectedItems', itemId));
      setSelectedItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Handle marker tap to display image
  const handleMarkerPress = (marker) => {
    const selectedItem = selectedItems.find(item => item.category === marker.category);
    if (selectedItem?.imageUrl) { // Ensure the item has an image URL
      setSelectedImage(selectedItem.imageUrl);  // Set the image URL
      setShowModal(true);  // Open the modal
    } else {
      console.log('No image URL for this marker.');
    }
  };

  // Render markers on the map based on the selected items' categories
  const renderMarkers = () => {
    const markersToRender = showAllMarkers ? markerPositions : filteredMarkers;
    return markersToRender.map((marker) => (
      <Circle
        key={`${marker.id}-${marker.category}`}  // Ensure uniqueness
        cx={marker.location.x}
        cy={marker.location.y}
        r="6"
        fill={marker.color}
        onPress={() => handleMarkerPress(marker)} // Handle marker tap
      />
    ));
  };

  // Toggle the visibility of all markers
  const toggleShowAllMarkers = () => {
    setShowAllMarkers(prevState => !prevState);
  };

  // Show the "See Items" modal
  const handleSeeItems = (category) => {
    const filteredItems = selectedItems.filter(item => item.category === category);
    setCategoryItems(filteredItems); // Set items belonging to the category
    setShowItemsModal(true);
  };

  // Close the "See Items" modal
  const handleCloseItemsModal = () => {
    setShowItemsModal(false);
  };

  return (
    <View style={styles.container}>
      <Image source={storeLayoutImage} style={styles.storeLayout} />

      <Svg style={styles.svgOverlay}>
        {renderMarkers()}
      </Svg>

      <View style={styles.legendContainer}>
        <ScrollView style={styles.scrollView}>
          {filteredMarkers.length > 0 ? (
            filteredMarkers.map((marker) => (
              <View key={marker.id} style={styles.legendItem}>
                <View style={[styles.legendCircle, { backgroundColor: marker.color }]} />
                <Text style={styles.legendText}>{marker.category}</Text>
                {/* "See Items" button next to category */}
                <TouchableOpacity onPress={() => handleSeeItems(marker.category)} style={styles.seeItemsButton}>
                  <Text style={styles.seeItemsText}>See Items</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No Items selected.</Text>
          )}
        </ScrollView>
      </View>

      {/* Button to toggle visibility of all markers */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={toggleShowAllMarkers} style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>
            {showAllMarkers ? 'Show Only Selected Markers' : 'Show All Markers'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for displaying the image */}
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={{ uri: selectedImage }} style={styles.modalImage} />
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal to show items in the category */}
      <Modal visible={showItemsModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.itemsModalTitle}>Items in this Category:</Text>
            {categoryItems.length > 0 ? (
              categoryItems.map((item) => (
                <View key={item.id} style={styles.itemContainer}>
                  <Text style={styles.itemText}>{item.name}</Text>
                  <Text style={styles.itemText}>Quantity: {item.quantity}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>No items available.</Text>
            )}
            <TouchableOpacity onPress={handleCloseItemsModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  storeLayout: {
    width: Dimensions.get('window').width - 20,
    height: 400,
    resizeMode: 'contain',
  },
  svgOverlay: {
    position: 'absolute',
    top: 40,
    left: 10,
    width: Dimensions.get('window').width - 20,
    height: 400,
  },
  legendContainer: {
    marginTop: 20,
    padding: 10,
    width: '100%',
  },
  scrollView: {
    maxHeight: 200,  // Adjust the height as needed
  },
  legendItem: {
    flexDirection: 'row',  // Ensures circle and text are side by side
    alignItems: 'center',  // Aligns the circle and text vertically
    marginVertical: 5,
  },
  legendCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5, // Makes the circle round
    marginRight: 10,   // Space between circle and category name
  },
  legendText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
  },
  seeItemsButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  seeItemsText: {
    color: '#fff',
  },
  buttonWrapper: {
    marginTop: 20,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  itemsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
  },
  noItemsText: {
    color: '#888',
    fontSize: 16,
  },
});
 