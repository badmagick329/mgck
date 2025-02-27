import { createContext, useContext } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

type EmojifyContextType = {
  showHelp: boolean;
  toggleHelp: () => void;
};

const EmojifyContext = createContext<EmojifyContextType | undefined>(undefined);

export const EmojifyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { value: showHelp, updateValue: setShowHelp } =
    useLocalStorage<boolean>('showEmojifyHelp', true);
  const toggleHelp = () => setShowHelp(!showHelp);

  return (
    <EmojifyContext.Provider value={{ showHelp, toggleHelp }}>
      {children}
    </EmojifyContext.Provider>
  );
};

export const useEmojifyContext = (): EmojifyContextType => {
  const context = useContext(EmojifyContext);
  if (context === undefined) {
    throw new Error(
      'useEmojifyContext must be used within a EmojifyContextProvider'
    );
  }
  return context;
};
