import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseconfig';
import { FlatList } from 'react-native-gesture-handler';

export default function Slider() {
  const [sliderList, setSliderList] = useState([]);
  const flatListRef = useRef(null); // Create a reference for FlatList
  const scrollInterval = useRef(null); // To store the scroll interval

  useEffect(() => {
    GetSliders();
    
    // Start auto-scrolling when the component is mounted
    const interval = setInterval(() => {
      if (flatListRef.current && sliderList.length > 0) {
        flatListRef.current.scrollToOffset({
          offset: (flatListRef.current.contentOffset.x + Dimensions.get('screen').width * 0.9 + 15) % (sliderList.length * (Dimensions.get('screen').width * 0.9 + 15)),
          animated: true,
        });
      }
    }, 3000); // Scroll every 3 seconds
    
    scrollInterval.current = interval; // Store the interval

    // Clean up the interval on component unmount
    return () => clearInterval(scrollInterval.current);
  }, [sliderList]);

  const GetSliders = async () => {
    const snapshot = await getDocs(collection(db, 'Sliders'));
    const sliders = snapshot.docs.map(doc => doc.data());
    setSliderList(sliders);
  };

  return (
    <View style={styles.container}>
      {sliderList.length > 0 ? (
        <FlatList 
          ref={flatListRef} // Attach the ref to the FlatList
          data={sliderList}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Image 
                source={{ uri: item?.imageUrl }}
                style={styles.sliderImage}
              />
            </View>
          )}
        />
      ) : (
        <Text style={styles.placeholderText}>No sliders available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sliderImage: {
    width: Dimensions.get('screen').width * 0.9,
    height: 170,
    borderRadius: 15,
    marginRight: 15,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 20,
  },
});
