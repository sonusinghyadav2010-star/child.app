
import { firebase } from './firebase'; // Assuming you have a firebase config file
import { doc, onSnapshot } from 'firebase/firestore';
import RTCService from './RTCService';
import GeofenceService from './GeofenceService';

class CommandListener {
  private rtcService: RTCService;
  private unsubscribe: (() => void) | null = null;

  constructor(rtcService: RTCService) {
    this.rtcService = rtcService;
  }

  public listenForCommands(childUid: string, parentUid: string) {
    const commandDocRef = doc(firebase.firestore(), 'commands', childUid);

    this.unsubscribe = onSnapshot(commandDocRef, (doc) => {
      if (doc.exists()) {
        const command = doc.data();
        this.handleCommand(command, parentUid, childUid);
      }
    });
  }

  private handleCommand(command: any, parentUid: string, childUid: string) {
    this.rtcService.setUids(parentUid, childUid);
    switch (command.type) {
      case 'start_camera_stream':
        this.rtcService.startCall(false, true); // isScreenSharing = false, video = true
        break;
      case 'start_audio_stream':
        this.rtcService.startCall(false, false); // isScreenSharing = false, video = false
        break;
      case 'start_screen_share':
        this.rtcService.startCall(true, true); // isScreenSharing = true, video = true
        break;
      case 'stop_stream':
        this.rtcService.close();
        break;
      case 'add_geofence':
        if (command.geofence) {
            GeofenceService.addGeofence(command.geofence);
        }
        break;
      case 'remove_geofence':
        if (command.geofenceId) {
            GeofenceService.removeGeofence(command.geofenceId);
        }
        break;
      default:
        console.log('Unknown command:', command.type);
    }
  }

  public stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default CommandListener;
