"use client";

import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useState,
} from "react";
import { GfyData } from "@/lib/types";

interface ContextProps {
  data: GfyData[];
  setData: Dispatch<SetStateAction<GfyData[]>>;
}

const GlobalContext = createContext<ContextProps>({
  data: [],
  setData: (): GfyData[] => [],
});

export const GlobalContextProvider = ({ children }: any) => {
  const [data, setData] = useState<[] | GfyData[]>([]);

  return (
    <GlobalContext.Provider value={{ data, setData }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
