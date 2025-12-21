
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { addGeofences } from '../services/Geofence';

const AddGeofence = () => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [marker, setMarker] = useState(null);
  const [radius, setRadius] = useState('100'); // Default radius in meters
  const [name, setName] = useState('');

  const handleMapPress = (e: any) => {
    setMarker(e.nativeEvent.coordinate);
  };

  const handleAddGeofence = () => {
    if (marker && name) {
      addGeofences([
        {
          id: name, // Using name as ID for simplicity
          latitude: marker.latitude,
          longitude: marker.longitude,
          radius: parseFloat(radius),
        },
      ]);
      // Clear form after adding
      setMarker(null);
      setName('');
      setRadius('100');
    } else {
      alert('Please select a location on the map and provide a name.');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
        {marker && <Circle center={marker} radius={parseFloat(radius) || 0} />}
      </MapView>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Geofence Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Radius (meters)"
          value={radius}
          onChangeText={setRadius}
          keyboardType="numeric"
        />
        <Button title="Add Geofence" onPress={handleAddGeofence} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default AddGeofence;
