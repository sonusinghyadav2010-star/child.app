
import { NativeModules } from 'react-native';

const { SharedPreferences } = NativeModules;

export const useSharedPreferences = () => {
  const setItem = async (key: string, value: string) => {
    await SharedPreferences.setItem(key, value);
  };

  const getItem = async (key: string, defaultValue: string) => {
    return await SharedPreferences.getItem(key, defaultValue);
  };

  return { setItem, getItem };
};
