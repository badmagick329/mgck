"use client";

import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useState,
} from "react";
import { GfyParsedResponse, GfyViewData } from "@/lib/types";

interface ContextProps {
  data: GfyParsedResponse;
  setData: Dispatch<SetStateAction<GfyParsedResponse>>;
  gfyViewData: GfyViewData;
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>;
}

const GlobalContext = createContext<ContextProps>({
  data: {} as GfyParsedResponse,
  setData: () => {},
  gfyViewData: {} as GfyViewData,
  setGfyViewData: () => {},
});

export const GlobalContextProvider = ({ children }: any) => {
  const [data, setData] = useState<GfyParsedResponse>({
    count: 0,
    previous: null,
    next: null,
    gfys: [],
  });
  const [gfyViewData, setGfyViewData] = useState<GfyViewData>({
    index: 0,
    videoIds: [] as string[],
    listUrl: "",
  });

  return (
    <GlobalContext.Provider
      value={{ data, setData, gfyViewData, setGfyViewData }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
