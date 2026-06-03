import {
  buildAllSearchParams,
  buildClearSearchParams,
  buildRecentSearchParams,
  buildTimelineShiftSearchParams,
  buildTodaySearchParams,
  getCanonicalKpopSearchParams,
  getKpopApiQuery,
  searchParamsToKpopQueryState,
} from '@/lib/kpop/query';

describe('kpop query helpers', () => {
  test('canonicalizes empty state to default recent browse window', () => {
    const params = getCanonicalKpopSearchParams(new URLSearchParams());

    expect(params.get('start-date')).toBeTruthy();
    expect(params.get('end-date')).toBeNull();
    expect(params.get('artist')).toBeNull();
  });

  test('normalizes invalid page and exact values', () => {
    const state = searchParamsToKpopQueryState(
      new URLSearchParams('start-date=250601&page=-4&exact=on')
    );

    expect(state.page).toBe(1);
    expect(state.exact).toBe(true);
  });

  test('earlier on open-ended browse creates previous week window', () => {
    const next = buildTimelineShiftSearchParams(
      new URLSearchParams('start-date=250601'),
      'earlier'
    );

    expect(next.get('start-date')).toBe('250525');
    expect(next.get('end-date')).toBe('250531');
  });

  test('later on open-ended browse creates next week window', () => {
    const next = buildTimelineShiftSearchParams(
      new URLSearchParams('start-date=250526'),
      'later'
    );

    expect(next.get('start-date')).toBe('250602');
    expect(next.get('end-date')).toBe('250608');
  });

  test('recent, today, all, and clear strip page and end-date state', () => {
    const source = new URLSearchParams(
      'start-date=250526&end-date=250601&artist=rv&page=3&exact=on'
    );

    expect(buildRecentSearchParams(source).get('end-date')).toBeNull();
    expect(buildRecentSearchParams(source).get('page')).toBeNull();
    expect(buildTodaySearchParams(source).get('end-date')).toBeNull();
    expect(buildAllSearchParams(source).get('start-date')).toBe('000101');
    expect(buildAllSearchParams(source).get('end-date')).toBeNull();
    expect(buildAllSearchParams(source).get('page')).toBeNull();
    expect(buildClearSearchParams(source).toString()).toMatch(/^start-date=/);
  });

  test('maps frontend timeline state to django api query names', () => {
    const state = searchParamsToKpopQueryState(
      new URLSearchParams('start-date=250526&end-date=250601&artist=rv&title=cosmic&exact=on&page=2')
    );

    expect(getKpopApiQuery(state)).toEqual({
      artist: 'rv',
      title: 'cosmic',
      start_date: '2025-05-26',
      end_date: '2025-06-01',
      page: '2',
      page_size: '100',
      exact: 'on',
    });
  });

  test('uses smaller page size for open-ended timeline windows', () => {
    const state = searchParamsToKpopQueryState(
      new URLSearchParams('start-date=250526')
    );

    expect(getKpopApiQuery(state)).toEqual({
      artist: '',
      title: '',
      start_date: '2025-05-26',
      end_date: '',
      page: '1',
      page_size: '10',
      exact: '',
    });
  });
});
