
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const ScreenTimeChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return <Text>No screen time data.</Text>;

  const labels = Object.keys(data).sort();
  const chartData = {
    labels: labels.map(label => label.substring(5)), // Show MM-DD
    datasets: [
      {
        data: labels.map(label => data[label] / (1000 * 60 * 60)), // Convert to hours
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen Time (Last 7 Days)</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix="h"
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ScreenTimeChart;
