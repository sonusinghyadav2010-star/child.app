
import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';

const { PermissionsModule } = NativeModules;

// Define a mapping from permission names to their IDs
const permissionIds = {
  location: "android.permission.ACCESS_FINE_LOCATION",
  callLog: "android.permission.READ_CALL_LOG",
  sms: "android.permission.READ_SMS",
  storage: "android.permission.READ_EXTERNAL_STORAGE",
  camera: "android.permission.CAMERA",
  audio: "android.permission.RECORD_AUDIO",
  usageStats: "android.permission.PACKAGE_USAGE_STATS",
  accessibility: "android.permission.BIND_ACCESSIBILITY_SERVICE",
  notification: "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
  deviceAdmin: "android.permission.BIND_DEVICE_ADMIN",
};

export const usePermissions = (requestedPermissions: (keyof typeof permissionIds)[]) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);

  const checkAllPermissions = useCallback(async () => {
    const newPermissions: Record<string, boolean> = {};
    let allGranted = true;

    for (const key of requestedPermissions) {
      const permissionId = permissionIds[key];
      if (permissionId) {
        const isGranted = await PermissionsModule.isPermissionGranted(permissionId);
        newPermissions[key] = isGranted;
        if (!isGranted) {
          allGranted = false;
        }
      }
    }

    setPermissions(newPermissions);
    setAllPermissionsGranted(allGranted);
  }, [requestedPermissions]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  const requestAllPermissions = async () => {
    for (const key of requestedPermissions) {
      const permissionId = permissionIds[key];
      if (permissionId && !permissions[key]) {
        await PermissionsModule.requestPermission(permissionId);
      }
    }
    await checkAllPermissions(); // Re-check all permissions after requesting
  };

  return {
    permissions,
    allPermissionsGranted,
    requestAllPermissions,
    checkAllPermissions,
  };
};
