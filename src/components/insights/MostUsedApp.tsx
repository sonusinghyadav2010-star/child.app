
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const formatTime = (milliseconds) => {
  if (!milliseconds) return "0m";
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const MostUsedApp = ({ app }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Most Used App</Text>
    {app ? (
      <>
        <Text style={styles.appName}>{app.appName}</Text>
        <Text style={styles.time}>{formatTime(app.time)}</Text>
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
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
});

export default MostUsedApp;
