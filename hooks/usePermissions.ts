
import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';

const { PermissionsModule } = NativeModules;

export const usePermissions = (permissionId: string) => {
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const result = await PermissionsModule.isPermissionGranted(permissionId);
    setIsGranted(result);
  };

  const requestPermission = async () => {
    const result = await PermissionsModule.requestPermission(permissionId);
    setIsGranted(result);
    return result;
  };

  return { isGranted, requestPermission, checkPermission };
};
