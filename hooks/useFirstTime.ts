
import { storage } from "@/app/_layout";
import { useEffect, useState } from "react";

const KEY = "permissionsSetupComplete";

export function useFirstTime() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    const isFirst = !storage.getBoolean(KEY);
    setIsFirstTime(isFirst);
  }, []);

  const setSetupComplete = () => {
    storage.set(KEY, true);
    setIsFirstTime(false);
  };

  return {
    isFirstTime,
    setSetupComplete,
  };
}
