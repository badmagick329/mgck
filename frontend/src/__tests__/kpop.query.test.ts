import {
  buildAllSearchParams,
  buildClearSearchParams,
  buildFollowingSearchParams,
  buildRecentSearchParams,
  buildSearchSearchParams,
  buildTimelineShiftSearchParams,
  buildTodaySearchParams,
  canShiftTimelineEarlier,
  getActiveKpopPreset,
  getCanonicalKpopSearchParams,
  getKpopApiQuery,
  getKpopView,
  hasKpopSearchFilters,
  searchParamsToKpopQueryState,
} from '@/lib/kpop/query';

describe('kpop query helpers', () => {
  test('does not treat timeline dates as search filters', () => {
    expect(
      hasKpopSearchFilters(new URLSearchParams('start-date=250525'))
    ).toBe(false);
    expect(
      hasKpopSearchFilters(
        new URLSearchParams('start-date=250525&artist=Red%20Velvet')
      )
    ).toBe(true);
  });

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

  test('clamps earlier navigation at the archive boundary', () => {
    const boundary = searchParamsToKpopQueryState(
      new URLSearchParams('start-date=000101')
    );
    const partialWeek = buildTimelineShiftSearchParams(
      new URLSearchParams('start-date=000104&end-date=000110'),
      'earlier'
    );
    const atBoundary = buildTimelineShiftSearchParams(
      new URLSearchParams('start-date=000101'),
      'earlier'
    );

    expect(canShiftTimelineEarlier(boundary)).toBe(false);
    expect(partialWeek.get('start-date')).toBe('000101');
    expect(partialWeek.get('end-date')).toBe('000103');
    expect(atBoundary.get('start-date')).toBe('000101');
    expect(atBoundary.get('end-date')).toBeNull();
  });

  test('clamps explicit pre-2000 dates to the archive boundary', () => {
    const params = getCanonicalKpopSearchParams(
      new URLSearchParams('start-date=19991225&end-date=20000103')
    );

    expect(params.get('start-date')).toBe('000101');
    expect(params.get('end-date')).toBe('20000103');
  });

  test('preserves following mode canonically and leaves it for timeline presets', () => {
    const following = buildFollowingSearchParams(
      new URLSearchParams('start-date=250526&page=3')
    );

    expect(getKpopView(following)).toBe('following');
    expect(getCanonicalKpopSearchParams(following).get('view')).toBe(
      'following'
    );
    expect(buildRecentSearchParams(following).get('view')).toBeNull();
  });

  test('opens search without discarding the current date range', () => {
    const search = buildSearchSearchParams(
      new URLSearchParams('start-date=250526&end-date=250601&page=3')
    );

    expect(getKpopView(search)).toBe('search');
    expect(search.get('start-date')).toBe('250526');
    expect(search.get('end-date')).toBe('250601');
    expect(search.get('page')).toBeNull();
  });

  test('identifies only the active browse preset', () => {
    expect(getActiveKpopPreset(new URLSearchParams('start-date=000101'))).toBe(
      'all'
    );
    expect(
      getActiveKpopPreset(
        buildFollowingSearchParams(new URLSearchParams('start-date=000101'))
      )
    ).toBe('following');
    expect(
      getActiveKpopPreset(
        new URLSearchParams('start-date=250526&end-date=250601')
      )
    ).toBeNull();
  });

  test('maps frontend timeline state to django api query names', () => {
    const state = searchParamsToKpopQueryState(
      new URLSearchParams(
        'start-date=250526&end-date=250601&artist=rv&title=cosmic&exact=on&page=2'
      )
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
