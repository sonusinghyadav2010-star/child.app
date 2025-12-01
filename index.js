
import { AppRegistry } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const HeadlessTask = async (taskData) => {
  console.log('Receiving Headless Task', taskData);
  const { event, data } = taskData;
  const deviceId = 'temporary-device-id'; // This should be retrieved from storage

  if (event === 'app.in.foreground') {
    await firestore()
      .collection('childDevices')
      .doc(deviceId)
      .collection('appUsage')
      .add({
        packageName: data.packageName,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
  } else if (event === 'notification.posted') {
    await firestore()
      .collection('childDevices')
      .doc(deviceId)
      .collection('notifications')
      .add({
        packageName: data.packageName,
        title: data.title,
        text: data.text,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
  }
};

AppRegistry.registerHeadlessTask('GuardianHeadlessTask', () => HeadlessTask);
