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
  videoVolume: number;
  setVideoVolume: Dispatch<SetStateAction<number>>;
}

const GlobalContext = createContext<ContextProps>({
  data: {} as GfyParsedResponse,
  setData: () => {},
  gfyViewData: {} as GfyViewData,
  setGfyViewData: () => {},
  videoVolume: 0,
  setVideoVolume: () => {},
});

export const GlobalContextProvider = ({ children }: any) => {
  const [data, setData] = useState<GfyParsedResponse>({
    count: 0,
    previous: null,
    next: null,
    totalPages: 0,
    gfys: [],
  });
  const [gfyViewData, setGfyViewData] = useState<GfyViewData>({
    index: 0,
    videoIds: [] as string[],
    listUrl: "",
  });
  const [volume, setVolume] = useState<number>(0);

  return (
    <GlobalContext.Provider
      value={{
        data,
        setData,
        gfyViewData,
        setGfyViewData,
        videoVolume: volume,
        setVideoVolume: setVolume,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
