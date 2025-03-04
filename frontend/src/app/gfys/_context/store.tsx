'use client';

import { searchGfys } from '@/actions/gfys';
import { GFYS_BASE } from '@/lib/consts/urls';
import { GfyParsedResponse, GfyViewData } from '@/lib/types/gfys';
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
  goToNextGfy: (loop?: boolean) => Promise<string | null>;
  goToPreviousGfy: (loop?: boolean) => Promise<string | null>;
  nextGfyExists: () => boolean;
  previousGfyExists: () => boolean;
  videoVolume: number;
  setVideoVolume: Dispatch<SetStateAction<number>>;
  updateDataFromParams: (params: ReadonlyURLSearchParams) => Promise<void>;
  loopAll: boolean;
  setLoopAll: (value: boolean) => void;
}

const GfyContext = createContext<ContextProps>({
  data: {} as GfyParsedResponse,
  gfyViewData: {} as GfyViewData,
  goToGfyAtIndex: () => '',
  goToNextGfy: async (loop = false) => '',
  goToPreviousGfy: async (loop = false) => '',
  nextGfyExists: () => false,
  previousGfyExists: () => false,
  videoVolume: 0,
  setVideoVolume: () => {},
  updateDataFromParams: async (params) => {},
  loopAll: false,
  setLoopAll: () => {},
});

export const GfyContextProvider = ({
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
  const [loopAll, setLoopAll] = useState<boolean>(false);

  const nextGfyExists = () => {
    return !!(gfyViewData.index < gfyViewData.videoIds.length - 1 || data.next);
  };

  const previousGfyExists = () => {
    return !!(gfyViewData.index > 0 || data.previous);
  };

  return (
    <GfyContext.Provider
      value={{
        data,
        gfyViewData,
        goToGfyAtIndex: (index) => {
          return goToGfyAtIndex(index, gfyViewData, setGfyViewData);
        },
        goToNextGfy: async (loop = false) => {
          return await goToNextGfy(
            data,
            setData,
            gfyViewData,
            setGfyViewData,
            loop
          );
        },
        goToPreviousGfy: async (loop = false) => {
          return await goToPreviousGfy(
            data,
            setData,
            gfyViewData,
            setGfyViewData,
            loop
          );
        },
        nextGfyExists,
        previousGfyExists,
        videoVolume: volume,
        setVideoVolume: setVolume,
        updateDataFromParams: async (params) => {
          await setDataFromParams(params, setData, setGfyViewData);
        },
        loopAll,
        setLoopAll,
      }}
    >
      {children}
    </GfyContext.Provider>
  );
};

export const useGfyContext = () => {
  const context = useContext(GfyContext);
  if (context === undefined) {
    throw new Error('useGfyContext must be used within a GfyContextProvider');
  }
  return context;
};

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

const goToGfyAtIndex = (
  index: number,
  gfyViewData: GfyViewData,
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>
): string => {
  setGfyViewData({
    ...gfyViewData,
    index,
  });
  return `${GFYS_BASE}/${gfyViewData.videoIds[index]}`;
};

const goToNextGfy = async (
  data: GfyParsedResponse,
  setData: Dispatch<SetStateAction<GfyParsedResponse>>,
  gfyViewData: GfyViewData,
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>,
  loop = false
) => {
  if (gfyViewData.index < gfyViewData.videoIds.length - 1) {
    return goToGfyAtIndex(gfyViewData.index + 1, gfyViewData, setGfyViewData);
  }

  if (data.next !== null) {
    return await setDataFromURL(data.next, setData, setGfyViewData, 0);
  }

  if (data.previous && loop) {
    const params = new URLSearchParams(data.previous.split('?')[1]);
    params.set('page', '1');
    const newData = await setDataFromParams(
      new ReadonlyURLSearchParams(params),
      setData,
      setGfyViewData
    );
    return `${GFYS_BASE}/${newData.gfys[0].imgurId}`;
  }

  return null;
};

const goToPreviousGfy = async (
  data: GfyParsedResponse,
  setData: Dispatch<SetStateAction<GfyParsedResponse>>,
  gfyViewData: GfyViewData,
  setGfyViewData: Dispatch<SetStateAction<GfyViewData>>,
  loop = false
) => {
  if (gfyViewData.index > 0) {
    return goToGfyAtIndex(gfyViewData.index - 1, gfyViewData, setGfyViewData);
  }

  if (data.previous === null) {
    if (data.next && loop) {
      const params = new URLSearchParams(data.next.split('?')[1]);
      params.set('page', data.totalPages.toString());
      const newData = await setDataFromParams(
        new ReadonlyURLSearchParams(params),
        setData,
        setGfyViewData
      );
      return `${GFYS_BASE}/${newData.gfys[newData.gfys.length - 1].imgurId}`;
    }
    return null;
  }

  return await setDataFromURL(data.previous, setData, setGfyViewData, -1);
};
