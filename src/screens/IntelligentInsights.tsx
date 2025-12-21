
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import TotalScreenTime from '../../components/insights/TotalScreenTime';
import MostUsedApp from '../../components/insights/MostUsedApp';
import TopAppUsage from '../../components/insights/TopAppUsage';
import ScreenTimeChart from '../../components/insights/ScreenTimeChart';
import PeakUsage from '../../components/insights/PeakUsage';

const getIntelligentInsights = httpsCallable(functions, 'getIntelligentInsights');

const IntelligentInsightsScreen = ({ childUid }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await getIntelligentInsights({ childUid, timeRange: 'last7days' });
        setInsights(result.data);
      } catch (error) {
        console.error("Error fetching intelligent insights:", error);
      } finally {
        setLoading(false);
      }
    };

    if (childUid) {
      fetchInsights();
    }
  }, [childUid]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Insights...</Text>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.centered}>
        <Text>No insights data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TotalScreenTime time={insights.totalScreenTime} />
        <MostUsedApp app={insights.mostUsedApp} />
        <PeakUsage peak={insights.peakUsage} />
      </View>
      <ScreenTimeChart data={insights.screenTimeByDay} />
      <TopAppUsage data={insights.topApps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});

export default IntelligentInsightsScreen;
