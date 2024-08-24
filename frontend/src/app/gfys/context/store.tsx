'use client';

import { searchGfys } from '@/actions/gfys';
import { GFYS_BASE } from '@/lib/consts/urls';
import { GfyParsedResponse, GfyViewData } from '@/lib/types';
import {
  createURL,
  formDataFromSearchParams,
  parseGfyResponse,
} from '@/lib/utils/gfys';
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
  gfyViewData: GfyViewData;
  goToGfyAtIndex: (index: number) => string;
  videoVolume: number;
  setVideoVolume: Dispatch<SetStateAction<number>>;
  updateDataFromParams: (params: ReadonlyURLSearchParams) => Promise<void>;
  updateDataFromURL: (
    url: string,
    startIndex: number
  ) => Promise<string | null>;
  slideshow: boolean;
  setSlideShow: (value: boolean) => void;
}

const GlobalContext = createContext<ContextProps>({
  data: {} as GfyParsedResponse,
  gfyViewData: {} as GfyViewData,
  goToGfyAtIndex: () => '',
  videoVolume: 0,
  setVideoVolume: () => {},
  updateDataFromParams: async (params) => {},
  updateDataFromURL: async (url, startIndex) => {
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
  const goToGfyAtIndex = (index: number): string => {
    setGfyViewData({
      ...gfyViewData,
      index,
    });
    return `${GFYS_BASE}/${gfyViewData.videoIds[index]}`;
  };

  return (
    <GlobalContext.Provider
      value={{
        data,
        gfyViewData,
        goToGfyAtIndex,
        videoVolume: volume,
        setVideoVolume: setVolume,
        updateDataFromParams: async (params) => {
          await setDataFromParams(params, setData, setGfyViewData);
        },
        updateDataFromURL: async (url, startIndex = 0) => {
          return await setDataFromURL(url, setData, setGfyViewData, startIndex);
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

const setDataFromParams = async (
  params: ReadonlyURLSearchParams,
  setData: Dispatch<SetStateAction<GfyParsedResponse>>,
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>,
  startIndex = 0
) => {
  const listURL = createURL(GFYS_BASE, params.toString());
  const resp = await searchGfys(formDataFromSearchParams(params));
  const d = parseGfyResponse(resp);
  setData(d);
  setGfyViewData({
    index: startIndex === 0 ? 0 : d.gfys.length - 1,
    videoIds: d.gfys.map((g) => g.imgurId),
    listUrl: listURL,
  });
  return d;
};

const setDataFromURL = async (
  url: string,
  setData: Dispatch<SetStateAction<GfyParsedResponse>>,
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>,
  startIndex = 0
) => {
  const splitURL = url.split('?');
  if (splitURL.length < 2) {
    // NOTE: This would only happen if the passed url had no params.
    // This url would be coming from the server and should always have all params
    console.error('No URL params found in passed URL');
    return null;
  }
  const params = new ReadonlyURLSearchParams(new URLSearchParams(splitURL[1]));
  const newData = await setDataFromParams(
    params,
    setData,
    setGfyViewData,
    startIndex
  );
  const newIndex = startIndex === 0 ? 0 : newData.gfys.length - 1;
  const newGfyURL = `${GFYS_BASE}/${newData.gfys[newIndex].imgurId}`;
  return newGfyURL;
};
