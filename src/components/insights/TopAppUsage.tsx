
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const formatTimeForLabel = (milliseconds) => {
  if (!milliseconds) return "0m";
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  return `${hours}h`;
};

const TopAppUsage = ({ data }) => {
  if (!data || data.length === 0) return <Text>No app usage data.</Text>;

  const chartData = {
    labels: data.map(item => item.appName),
    datasets: [
      {
        data: data.map(item => item.time / (1000 * 60 * 60)), // Convert to hours
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top App Usage (Last 7 Days)</Text>
      <BarChart
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

export default TopAppUsage;
