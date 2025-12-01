import { NativeModules } from 'react-native';
import { db } from '../firebase/firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebaseConfig';
import MonitoringManager from './MonitoringManager'; // For executing commands
// import WebRtcManager from './WebRtcManager'; // For executing WebRTC commands

const { MonitoringModule } = NativeModules; // To call native methods directly

interface RemoteCommand {
  type: string;
  payload?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: any; // Firestore Timestamp
  requesterUid: string;
  id?: string; // Document ID
}

class RemoteCommandService {
  private unsubscribe: (() => void) | null = null;
  private childUid: string | null = null;

  init() {
    this.childUid = auth.currentUser?.uid || null;
    if (!this.childUid) {
      console.warn('RemoteCommandService: No child UID found. Commands will not be processed.');
      return;
    }

    console.log(`RemoteCommandService: Listening for commands for child ${this.childUid}`);
    const commandDocRef = doc(db, 'commands', this.childUid); // Listen to the child's own command document

    this.unsubscribe = onSnapshot(commandDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const commandData = { id: docSnap.id, ...docSnap.data() } as RemoteCommand;
        console.log('RemoteCommandService: Received command:', commandData.type, commandData.status);

        if (commandData.status === 'pending') {
          // Acknowledge command reception
          await this.updateCommandStatus(commandData.id!, 'executing');
          await this.executeCommand(commandData);
        }
      }
    }, (error) => {
      console.error('RemoteCommandService: Error listening to commands:', error);
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('RemoteCommandService: Stopped listening for commands.');
    }
  }

  private async executeCommand(command: RemoteCommand) {
    try {
      let result: boolean = false;
      switch (command.type) {
        case 'take_photo':
          result = await MonitoringManager.takePhotoAndUpload();
          break;
        case 'switch_camera':
          result = await MonitoringManager.switchCamera();
          break;
        // case 'start_webrtc_screenshare':
        //   await WebRtcManager.requestMediaProjectionPermission(); // Ensure permission
        //   await WebRtcManager.startWebRtcSession(); // This will automatically create an offer
        //   result = true;
        //   break;
        // case 'stop_webrtc_screenshare':
        //   result = await WebRtcManager.stopWebRtcSession();
        //   break;
        case 'request_location_update':
          // The LocationTracker runs continuously, so this command could just log a force update or current location
          console.log('Requesting immediate location update (LocationTracker runs continuously)');
          result = true; // Assume success if tracker is running
          break;
        case 'send_message':
          console.log('Child received message:', command.payload?.message);
          // Example: Display a native toast or notification
          MonitoringModule.displayToast(command.payload?.message || "Message from parent");
          result = true;
          break;
        default:
          console.warn('RemoteCommandService: Unknown command type:', command.type);
          result = false;
      }
      await this.updateCommandStatus(command.id!, result ? 'completed' : 'failed');
    } catch (error) {
      console.error('RemoteCommandService: Error executing command:', command.type, error);
      await this.updateCommandStatus(command.id!, 'failed', (error as Error).message);
    }
  }

  private async updateCommandStatus(commandId: string, status: 'pending' | 'executing' | 'completed' | 'failed', errorMessage?: string) {
    if (!this.childUid) return;
    const commandDocRef = doc(db, 'commands', this.childUid);
    try {
      await updateDoc(commandDocRef, {
        [`${commandId}.status`]: status, // Update the specific command's status
        [`${commandId}.updatedAt`]: new Date(),
        [`${commandId}.errorMessage`]: errorMessage || null,
      });
      console.log(`RemoteCommandService: Command ${commandId} status updated to ${status}`);
    } catch (error) {
      console.error(`RemoteCommandService: Error updating command status for ${commandId}:`, error);
    }
  }
}

export default new RemoteCommandService();