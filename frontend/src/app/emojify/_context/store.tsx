'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { defaultEmojis, emojisForPack } from '@/lib/emojify';
import { EmojiIntensity, EmojiPackId } from '@/lib/consts/emojify';

type EmojifyContextType = {
  emojisInput: string;
  setEmojisInput: (newInput: string) => void;
  selectedPack: EmojiPackId;
  setSelectedPack: (pack: EmojiPackId) => void;
  intensity: EmojiIntensity;
  setIntensity: (intensity: EmojiIntensity) => void;
  messageInput: string;
  setMessageInput: (newMessage: string) => void;
  isLoaded: boolean;
};

const EmojifyContext = createContext<EmojifyContextType | undefined>(undefined);

export const EmojifyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { value: customEmojis, updateValue: setCustomEmojis } = useLocalStorage(
    'defaultEmojis',
    defaultEmojis()
  );
  const { value: selectedPack, updateValue: setSelectedPack } =
    useLocalStorage<EmojiPackId>('emojifySelectedPack', 'original');
  const { value: intensity, updateValue: setIntensity } =
    useLocalStorage<EmojiIntensity>('emojifyIntensity', 'chaos');
  const emojisInput = emojisForPack(selectedPack, customEmojis);
  const setEmojisInput = (newInput: string) => setCustomEmojis(newInput);

  const [messageInput, setMessageInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <EmojifyContext.Provider
      value={{
        emojisInput,
        setEmojisInput,
        selectedPack,
        setSelectedPack,
        intensity,
        setIntensity,
        messageInput,
        setMessageInput,
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
