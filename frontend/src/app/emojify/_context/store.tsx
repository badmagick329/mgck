'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { defaultEmojis } from '@/lib/emojify';

type EmojifyContextType = {
  showHelp: boolean;
  toggleHelp: () => void;
  emojisInput: string;
  setEmojisInput: (newInput: string) => void;
  messageInput: string;
  setMessageInput: (newMessage: string) => void;
  messageInputTextAreaRows: number;
  setMessageInputTextAreaRows: (newRows: number) => void;
  isLoaded: boolean;
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

  const { value: emojisInput, updateValue: _setEmojisInput } = useLocalStorage(
    'defaultEmojis',
    defaultEmojis()
  );
  const setEmojisInput = (newInput: string) => _setEmojisInput(newInput);

  const {
    value: messageInputTextAreaRows,
    updateValue: setMessageInputTextAreaRows,
  } = useLocalStorage<number>('emojifyMessageInputTextAreaRows', 5);

  const [messageInput, setMessageInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <EmojifyContext.Provider
      value={{
        showHelp,
        toggleHelp,
        emojisInput,
        setEmojisInput,
        messageInput,
        setMessageInput,
        messageInputTextAreaRows,
        setMessageInputTextAreaRows,
        isLoaded,
      }}
    >
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
