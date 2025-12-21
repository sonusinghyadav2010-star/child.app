
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PeakUsage = ({ peak }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Peak Usage</Text>
    {peak ? (
      <>
        <Text style={styles.time}>{peak.time}</Text>
        <Text style={styles.day}>{peak.day}</Text>
      </>
    ) : (
      <Text>No data</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 150,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  time: {
    fontSize: 20,
    fontWeight: 'bold', 
    color: '#000',
    marginVertical: 5,
  },
  day: {
    fontSize: 14,
    color: '#666',
  },
});

export default PeakUsage;
