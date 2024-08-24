'use client';

import { searchGfys } from '@/actions/gfys';
import { GfyParsedResponse, GfyViewData } from '@/lib/types';
import { formDataFromSearchParams, parseGfyResponse } from '@/lib/utils/gfys';
import { ReadonlyURLSearchParams } from 'next/navigation';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

interface ContextProps {
  data: GfyParsedResponse;
  setData: Dispatch<SetStateAction<GfyParsedResponse>>;
  gfyViewData: GfyViewData;
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>;
  videoVolume: number;
  setVideoVolume: Dispatch<SetStateAction<number>>;
  updateDataFromParams: (
    params: ReadonlyURLSearchParams
  ) => Promise<GfyParsedResponse>;
  updateDataFromURL: (url: string) => Promise<GfyParsedResponse | null>;
  slideshow: boolean;
  setSlideShow: (value: boolean) => void;
}

const GlobalContext = createContext<ContextProps>({
  data: {} as GfyParsedResponse,
  setData: () => {},
  gfyViewData: {} as GfyViewData,
  setGfyViewData: () => {},
  videoVolume: 0,
  setVideoVolume: () => {},
  updateDataFromParams: async (params) => {
    return {} as GfyParsedResponse;
  },
  updateDataFromURL: async (url) => {
    return null;
  },
  slideshow: false,
  setSlideShow: () => {},
});

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
    listUrl: '',
  });
  const [volume, setVolume] = useState<number>(0);
  const [slideshow, setSlideShow] = useState<boolean>(false);

  return (
    <GlobalContext.Provider
      value={{
        data,
        setData,
        gfyViewData,
        setGfyViewData,
        videoVolume: volume,
        setVideoVolume: setVolume,
        updateDataFromParams: async (params) => {
          const resp = await searchGfys(formDataFromSearchParams(params));
          const d = parseGfyResponse(resp);
          setData(d);
          return d;
        },
        updateDataFromURL: async (url) => {
          const splitURL = url.split('?');
          if (splitURL.length < 2) {
            return null;
          }
          const params = new URLSearchParams(splitURL[1]);
          const resp = await searchGfys(formDataFromSearchParams(params));
          const d = parseGfyResponse(resp);
          setData(d);
          return d;
        },
        slideshow,
        setSlideShow,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
