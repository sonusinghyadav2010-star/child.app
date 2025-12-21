
import { AppState, AppStateStatus } from 'react-native';
import { getDeviceDetails } from './DeviceDetails';
import { updateDeviceStatus } from '../firebase/cloudFunctions';
import * as Background from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const HEARTBEAT_INTERVAL = 15 * 60 * 1000; // 15 minutes
const BACKGROUND_FETCH_TASK = 'background-heartbeat';

let heartbeatInterval: NodeJS.Timeout | null = null;

async function sendHeartbeat() {
    console.log('Sending heartbeat...');
    const details = await getDeviceDetails();
    if (details) {
        try {
            // We only need to send details that can change
            const {
                batteryLevel,
                isCharging,
                ipAddress,
                onlineStatus,
                lastSync
            } = details;

            await updateDeviceStatus({ 
                updatedDetails: {
                    batteryLevel,
                    isCharging,
                    ipAddress,
                    onlineStatus,
                    lastSync
                } 
            });
            console.log('Heartbeat sent successfully');
        } catch (error) {
            console.error('Error sending heartbeat:', error);
        }
    }
}

function handleAppStateChange(nextAppState: AppStateStatus) {
    if (nextAppState === 'active') {
        console.log('App has come to the foreground!');
        sendHeartbeat();
        startHeartbeat();
    } else {
        console.log('App has gone to the background');
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }
}

export function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    console.log('Heartbeat started');
}

export function initializeHeartbeat() {
    AppState.addEventListener('change', handleAppStateChange);
    startHeartbeat();
    sendHeartbeat(); // Initial heartbeat on startup
    registerBackgroundFetch();
}

// Background fetch setup
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        console.log('Background fetch task running...');
        await sendHeartbeat();
        return Background.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('Background fetch task failed:', error);
        return Background.BackgroundFetchResult.Failed;
    }
});

async function registerBackgroundFetch() {
    try {
        await Background.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 15 * 60, // 15 minutes
            stopOnTerminate: false,
            startOnBoot: true,
        });
        console.log('Background fetch task registered');
    } catch (error) {
        console.error('Error registering background fetch task:', error);
    }
}
