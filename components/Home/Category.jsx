import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseconfig';
import ItemListCollection from './ItemListCollection';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebaseconfig';

export default function Category({ category, navigation }) { // Add navigation prop here
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Canned');
  const [showModal, setShowModal] = useState(false);
  const [itemList, setItemList] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

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
    setShowModal(true);
    category(itemName); // Send selected category to parent
    GetItemList(itemName);
  };

  const GetItemList = async (category) => {
    const q = query(collection(db, 'Items'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((doc) => doc.data());
    setItemList(items);
    setFilteredItems(items);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === '') {
      setFilteredItems(itemList);
    } else {
      const filtered = itemList.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
    }
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
            key={item.name}
            onPress={() => handleCategoryClick(item.name)}
            style={styles.categoryItem}
          >
            <View
              style={[
                styles.container,
                selectedCategory === item.name && styles.selectedCategoryContainer,
              ]}
            >
              <Image
                source={{ uri: item?.imageUrl }}
                style={styles.categoryImage}
              />
            </View>
            <Text style={styles.itemName}>{item?.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedCategory} Items</Text>

            {/* Search Bar */}
            <TextInput
              style={styles.searchBar}
              placeholder="Search items..."
              value={searchTerm}
              onChangeText={handleSearch}
            />

            <ScrollView style={styles.itemListContainer}>
              {filteredItems.length === 0 ? (
                <Text>No items available in this category</Text>
              ) : (
                <View style={styles.gridContainer}>
                  {filteredItems.map((item, index) => (
                    <ItemListCollection
                      key={index.toString()}
                      product={item}
                      onAdd={handleAddItemToList}
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
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
    justifyContent: 'space-between',
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
    width: '30%',
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
  searchBar: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
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
