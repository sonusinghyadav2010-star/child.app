
import { NativeModules } from "react-native";
import React, { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";

const { PermissionModule } = NativeModules;

export function PermissionStep({ step, onComplete }) {
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await PermissionModule.isPermissionGranted(step.permission);
    setIsGranted(granted);
  };

  const requestPermission = async () => {
    const granted = await PermissionModule.requestPermission(step.permission);
    if (granted) {
      setIsGranted(true);
    }
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>{step.title}</Text>
      <Text style={{ marginBottom: 10 }}>
        Status: {isGranted ? "Granted" : "Not Granted"}
      </Text>
      {!isGranted && (
        <Button title="Request Permission" onPress={requestPermission} />
      )}
      {isGranted && <Button title="Next" onPress={onComplete} />}
    </View>
  );
}
