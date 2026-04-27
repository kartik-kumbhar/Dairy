import { createContext, useContext, useEffect, useState } from "react";
import { isReallyOnline } from "../utils/networkService";

const NetworkContext = createContext<{ isOnline: boolean }>({
  isOnline: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NetworkProvider = ({ children }: any) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
      const status = await isReallyOnline();
      setIsOnline(status);
    };

    const handleOffline = () => setIsOnline(false);

    check();

    window.addEventListener("online", check);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(check, 8000);

    return () => {
      window.removeEventListener("online", check);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNetwork = () => useContext(NetworkContext);