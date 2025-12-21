
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import { firebase } from './firebase'; // Assuming you have a firebase config file
import { getFunctions, httpsCallable } from 'firebase/functions';
import WebRTCModule from '../modules/WebRTCModule';

const functions = getFunctions(firebase);
const sendWebRTCSignal = httpsCallable(functions, 'sendWebRTCSignal');

class RTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: any; // MediaStream
  private remoteStream: any; // MediaStream
  private parentUid: string | null = null;
  private childUid: string | null = null;
  private onRemoteStream: (stream: any) => void;

  constructor(onRemoteStream: (stream: any) => void) {
    this.onRemoteStream = onRemoteStream;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    this.peerConnection.onicecandidate = this.onIceCandidate;
    this.peerConnection.onaddstream = this.onAddStream;
  }

  public setUids = (parentUid: string, childUid: string) => {
    this.parentUid = parentUid;
    this.childUid = childUid;
  }

  private onIceCandidate = (event: any) => {
    if (event.candidate && this.parentUid) {
      // Send the candidate to the remote peer
      sendWebRTCSignal({
        targetUid: this.parentUid,
        signal: {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        },
      });
    }
  };

  private onAddStream = (event: any) => {
    if (event.stream && this.remoteStream !== event.stream) {
      this.remoteStream = event.stream;
      this.onRemoteStream(event.stream);
    }
  };

  public startCall = async (isScreenSharing: boolean, video: boolean) => {
    try {
      if (isScreenSharing) {
        await WebRTCModule.requestScreenCapturePermission();
        this.localStream = await WebRTCModule.startScreenStream();
      } else {
        this.localStream = await mediaDevices.getUserMedia({
          audio: true,
          video: video,
        });
      }

      this.peerConnection.addStream(this.localStream);

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      if (this.parentUid) {
        // Send the offer to the remote peer
        sendWebRTCSignal({
          targetUid: this.parentUid,
          signal: {
            type: 'offer',
            sdp: offer.sdp,
          },
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  public handleSignal = async (signal: any) => {
    try {
      if (signal.type === 'offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        if (this.parentUid) {
          // Send the answer to the remote peer
          sendWebRTCSignal({
            targetUid: this.parentUid,
            signal: {
              type: 'answer',
              sdp: answer.sdp,
            },
          });
        }
      } else if (signal.type === 'answer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'candidate') {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  public close = () => {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
    }
    WebRTCModule.stopScreenStream();
    WebRTCModule.stopCameraStream();
  };
}

export default RTCService;
