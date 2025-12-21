
import { NativeModules } from 'react-native';

const { WebFilteringModule } = NativeModules;

interface IWebFilteringModule {
  isAccessibilityServiceEnabled(): Promise<boolean>;
  requestAccessibilityPermission(): void;
}

export default WebFilteringModule as IWebFilteringModule;
