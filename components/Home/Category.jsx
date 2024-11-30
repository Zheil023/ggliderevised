import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseconfig';
import ItemListCollection from './ItemListCollection'; // Import ItemListCollection component

export default function Category({ category }) {
  const [categoryList, setCategoryList] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('Canned');
  const [showModal, setShowModal] = useState(false); // State for showing modal
  const [itemList, setItemList] = useState([]); // Store items for selected category
  const [selectedItems, setSelectedItems] = useState([]); // Store selected items in modal

  useEffect(() => {
    GetCategories();
  }, []);

  const GetCategories = async () => {
    const categoryArray = [];
    const snapshot = await getDocs(collection(db, 'Category'));
    snapshot.forEach((doc) => {
      categoryArray.push(doc.data());
    });
    setCategoryList(categoryArray);
  };

  const handleCategoryClick = (itemName) => {
    setSelectedCategory(itemName);
    setShowModal(true); // Open modal when a category is clicked
    category(itemName); // Send selected category to parent
    GetItemList(itemName); // Fetch items for the selected category
  };

  const GetItemList = async (category) => {
    const q = query(collection(db, 'Items'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((doc) => doc.data());
    setItemList(items); // Set items for the selected category
  };

  const handleAddItemToList = (item) => {
    setSelectedItems((prevItems) => [...prevItems, item]);
  };

  return (
    <View style={styles.categoryWrapper}>
      <Text style={styles.categoryText}>Category</Text>

      <View style={styles.categoryContainer}>
        {categoryList.map((item) => (
          <TouchableOpacity
            key={item.name} // Use item name for keys
            onPress={() => handleCategoryClick(item.name)}
            style={styles.categoryItem}
          >
            <View style={[styles.container, selectedCategory === item.name && styles.selectedCategoryContainer]}>
              <Image
                source={{ uri: item?.imageUrl }}
                style={styles.categoryImage}
              />
            </View>
            <Text style={styles.itemName}>{item?.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal for adding items */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)} // Close modal when back pressed
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedCategory} Items</Text>
            
            <ScrollView style={styles.itemListContainer}>
              {itemList.length === 0 ? (
                <Text>No items available in this category</Text>
              ) : (
                <View style={styles.gridContainer}>
                  {itemList.map((item, index) => (
                    <ItemListCollection
                      key={index.toString()}
                      product={item}
                      onAdd={handleAddItemToList}
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryWrapper: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute items evenly
  },
  categoryImage: {
    marginTop: 20,
    width: 70,
    height: 70,
  },
  categoryText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  categoryItem: {
    width: '30%', // Set each item to occupy 30% of the container width
    marginBottom: 15,
  },
  container: {
    backgroundColor: '#F3D0D7',
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    borderColor: '#F3D0D7',
    justifyContent: 'center',
  },
  itemName: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  selectedCategoryContainer: {
    backgroundColor: 'lightblue',
    borderColor: 'lightblue',
  },
  
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  
  // Grid Layout for Items
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly', // Even spacing between items
  },

  closeButton: {
    backgroundColor: '#a62639',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
