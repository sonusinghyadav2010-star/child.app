
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const formatTime = (milliseconds) => {
  if (!milliseconds) return "0m";
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const TotalScreenTime = ({ time }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Total Screen Time</Text>
    <Text style={styles.time}>{formatTime(time)}</Text>
    <Text style={styles.period}>Last 7 days</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  period: {
    fontSize: 12,
    color: '#666',
  },
});

export default TotalScreenTime;
