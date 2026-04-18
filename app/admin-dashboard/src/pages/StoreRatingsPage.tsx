import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LineChart, LineChartSeries } from '../components/LineChart';
import {
  ALL_APP_IDS,
  AppId,
  DailySnapshot,
  StoreReview,
  storeRatingsService,
} from '../services/store-ratings.service';
import './StoreRatingsPage.css';

type Timeframe = 7 | 30 | 90;

const APP_LABELS: Record<AppId, string> = {
  'german-a1': 'German A1',
  'german-a2': 'German A2',
  'german-b1': 'German B1',
  'german-b2': 'German B2',
  'english-b1': 'English B1',
  'english-b2': 'English B2',
  'goethe-german-a1': 'Goethe A1',
  'dele-spanish-b1': 'Spanish B1',
};

const IOS_COLOR = '#58a6ff';
const ANDROID_COLOR = '#3dba4e';

function StarBar({ histogram }: { histogram: { '1': number; '2': number; '3': number; '4': number; '5': number } }) {
  const total = Object.values(histogram).reduce((a, b) => a + b, 0) || 1;
  const stars = (['5', '4', '3', '2', '1'] as const).map(k => ({
    star: k,
    count: histogram[k],
    pct: (histogram[k] / total) * 100,
  }));
  return (
    <div className="sr-histogram">
      {stars.map(s => (
        <div key={s.star} className="sr-histogram-row">
          <span className="sr-histogram-label">{'★'.repeat(Number(s.star))}</span>
          <div className="sr-histogram-bar-bg">
            <div className="sr-histogram-bar" style={{ width: `${s.pct}%` }} />
          </div>
          <span className="sr-histogram-count">{s.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: StoreReview }) {
  return (
    <div className="sr-review-card">
      <div className="sr-review-header">
        <span className="sr-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
        <span className="sr-review-author">{review.author}</span>
        <span className="sr-review-date">{review.date.slice(0, 10)}</span>
      </div>
      {review.title && <div className="sr-review-title">{review.title}</div>}
      <p className="sr-review-body">{review.body}</p>
    </div>
  );
}

function deltaPerDay(snapshots: DailySnapshot[], platform: 'ios' | 'android'): LineChartSeries['data'] {
  const points: { date: string; value: number }[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1][platform];
    const curr = snapshots[i][platform];
    if (prev && curr) {
      const delta = Math.max(0, curr.ratingsCount - prev.ratingsCount);
      points.push({ date: snapshots[i].date, value: delta });
    }
  }
  return points;
}

export const StoreRatingsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [selectedApp, setSelectedApp] = useState<AppId>('german-b1');

  // Combined (all-apps) state
  const [combinedSnapshots, setCombinedSnapshots] = useState<DailySnapshot[]>([]);
  const [combinedLoading, setCombinedLoading] = useState(true);

  // Per-app state
  const [appSnapshots, setAppSnapshots] = useState<DailySnapshot[]>([]);
  const [appLoading, setAppLoading] = useState(true);

  // Reviews state
  const [iosReviews, setIosReviews] = useState<StoreReview[]>([]);
  const [androidReviews, setAndroidReviews] = useState<StoreReview[]>([]);
  const [iosNextToken, setIosNextToken] = useState<string | null>(null);
  const [androidNextToken, setAndroidNextToken] = useState<string | null>(null);
  const [iosReviewsLoading, setIosReviewsLoading] = useState(false);
  const [androidReviewsLoading, setAndroidReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);

  // Load combined snapshots
  useEffect(() => {
    setCombinedLoading(true);
    storeRatingsService.getSnapshots(null, timeframe)
      .then(setCombinedSnapshots)
      .catch(e => toast.error(`Failed to load combined data: ${e.message}`))
      .finally(() => setCombinedLoading(false));
  }, [timeframe]);

  // Load per-app snapshots
  useEffect(() => {
    setAppLoading(true);
    setReviewsLoaded(false);
    setIosReviews([]);
    setAndroidReviews([]);
    setIosNextToken(null);
    setAndroidNextToken(null);
    storeRatingsService.getSnapshots(selectedApp, timeframe)
      .then(setAppSnapshots)
      .catch(e => toast.error(`Failed to load app data: ${e.message}`))
      .finally(() => setAppLoading(false));
  }, [selectedApp, timeframe]);

  const loadReviews = useCallback(async () => {
    setIosReviewsLoading(true);
    setAndroidReviewsLoading(true);
    setReviewsLoaded(true);
    try {
      const [ios, android] = await Promise.all([
        storeRatingsService.fetchReviews(selectedApp, 'ios'),
        storeRatingsService.fetchReviews(selectedApp, 'android'),
      ]);
      setIosReviews(ios.reviews);
      setIosNextToken(ios.nextPageToken);
      setAndroidReviews(android.reviews);
      setAndroidNextToken(android.nextPageToken);
    } catch (e: any) {
      toast.error(`Failed to load reviews: ${e.message}`);
    } finally {
      setIosReviewsLoading(false);
      setAndroidReviewsLoading(false);
    }
  }, [selectedApp]);

  const loadMoreIos = async () => {
    if (!iosNextToken) return;
    setIosReviewsLoading(true);
    try {
      const result = await storeRatingsService.fetchReviews(selectedApp, 'ios', iosNextToken);
      setIosReviews(prev => [...prev, ...result.reviews]);
      setIosNextToken(result.nextPageToken);
    } catch (e: any) {
      toast.error(`Failed to load more iOS reviews: ${e.message}`);
    } finally {
      setIosReviewsLoading(false);
    }
  };

  const handleTriggerSnapshot = async () => {
    setSnapshotting(true);
    try {
      await storeRatingsService.triggerSnapshot();
      storeRatingsService.clearCache();
      toast.success('Snapshot taken! Reloading data...');
      // Re-trigger both loads
      setCombinedLoading(true);
      setAppLoading(true);
      const [combined, app] = await Promise.all([
        storeRatingsService.getSnapshots(null, timeframe),
        storeRatingsService.getSnapshots(selectedApp, timeframe),
      ]);
      setCombinedSnapshots(combined);
      setAppSnapshots(app);
    } catch (e: any) {
      toast.error(`Snapshot failed: ${e.message}`);
    } finally {
      setSnapshotting(false);
      setCombinedLoading(false);
      setAppLoading(false);
    }
  };

  const loadMoreAndroid = async () => {
    if (!androidNextToken) return;
    setAndroidReviewsLoading(true);
    try {
      const result = await storeRatingsService.fetchReviews(selectedApp, 'android', androidNextToken);
      setAndroidReviews(prev => [...prev, ...result.reviews]);
      setAndroidNextToken(result.nextPageToken);
    } catch (e: any) {
      toast.error(`Failed to load more Android reviews: ${e.message}`);
    } finally {
      setAndroidReviewsLoading(false);
    }
  };

  // Build chart series for combined section
  const combinedRatingSeries: LineChartSeries[] = [
    {
      label: 'iOS avg rating',
      color: IOS_COLOR,
      data: combinedSnapshots
        .filter(s => s.ios)
        .map(s => ({ date: s.date, value: s.ios!.score })),
    },
    {
      label: 'Android avg rating',
      color: ANDROID_COLOR,
      data: combinedSnapshots
        .filter(s => s.android)
        .map(s => ({ date: s.date, value: s.android!.score })),
    },
  ];

  const combinedNewReviewsSeries: LineChartSeries[] = [
    { label: 'iOS new/day', color: IOS_COLOR, data: deltaPerDay(combinedSnapshots, 'ios') },
    { label: 'Android new/day', color: ANDROID_COLOR, data: deltaPerDay(combinedSnapshots, 'android') },
  ];

  const appRatingSeries: LineChartSeries[] = [
    {
      label: 'iOS rating',
      color: IOS_COLOR,
      data: appSnapshots.filter(s => s.ios).map(s => ({ date: s.date, value: s.ios!.score })),
    },
    {
      label: 'Android rating',
      color: ANDROID_COLOR,
      data: appSnapshots.filter(s => s.android).map(s => ({ date: s.date, value: s.android!.score })),
    },
  ];

  // Latest snapshot for per-app summary stats
  const latestSnap = appSnapshots[appSnapshots.length - 1];

  return (
    <div className="sr-container">
      {/* Header */}
      <div className="sr-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">Dashboard</Link>
            <span>›</span>
            <span>Store Ratings</span>
          </div>
          <h1>Store Ratings & Reviews</h1>
        </div>
        <div className="sr-header-right">
          <button
            className="sr-snapshot-btn"
            onClick={handleTriggerSnapshot}
            disabled={snapshotting}
          >
            {snapshotting ? 'Snapshotting...' : '📸 Snapshot Now'}
          </button>
          <div className="sr-timeframe-group">
            {([7, 30, 90] as Timeframe[]).map(tf => (
              <button
                key={tf}
                className={`sr-timeframe-btn${timeframe === tf ? ' active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sr-content">

        {/* ── Combined section ── */}
        <section className="sr-section">
          <h2 className="sr-section-title">All Apps Combined</h2>
          <div className="sr-charts-row">
            <div className="sr-chart-card">
              <h3 className="sr-chart-title">Average Rating</h3>
              {combinedLoading
                ? <div className="sr-loading-bar" style={{ height: 220 }} />
                : <LineChart
                    series={combinedRatingSeries}
                    height={220}
                    yLabel="Stars"
                    formatY={v => v.toFixed(2)}
                  />
              }
            </div>
            <div className="sr-chart-card">
              <h3 className="sr-chart-title">New Reviews / Day</h3>
              {combinedLoading
                ? <div className="sr-loading-bar" style={{ height: 220 }} />
                : <LineChart
                    series={combinedNewReviewsSeries}
                    height={220}
                    yLabel="Reviews"
                    formatY={v => String(Math.round(v))}
                    emptyMessage="Need ≥2 snapshots to compute delta"
                  />
              }
            </div>
          </div>
        </section>

        {/* ── Per-app section ── */}
        <section className="sr-section">
          <div className="sr-app-header">
            <h2 className="sr-section-title">Per App</h2>
            <select
              className="sr-app-select"
              value={selectedApp}
              onChange={e => setSelectedApp(e.target.value as AppId)}
            >
              {ALL_APP_IDS.map(id => (
                <option key={id} value={id}>{APP_LABELS[id]}</option>
              ))}
            </select>
          </div>

          {/* Rating trend */}
          <div className="sr-chart-card sr-chart-card--full">
            <h3 className="sr-chart-title">Rating Over Time</h3>
            {appLoading
              ? <div className="sr-loading-bar" style={{ height: 220 }} />
              : <LineChart
                  series={appRatingSeries}
                  height={220}
                  yLabel="Stars"
                  formatY={v => v.toFixed(2)}
                />
            }
          </div>

          {/* iOS vs Android split */}
          <div className="sr-platform-split">
            {/* iOS */}
            <div className="sr-platform-col">
              <div className="sr-platform-header ios">
                <span className="sr-platform-icon">🍎</span>
                <span className="sr-platform-label">iOS</span>
                {latestSnap?.ios && (
                  <span className="sr-platform-score">
                    ⭐ {latestSnap.ios.score.toFixed(2)} · {latestSnap.ios.ratingsCount.toLocaleString()} ratings
                  </span>
                )}
              </div>

              {/* Reviews */}
              {!reviewsLoaded ? (
                <button className="sr-load-reviews-btn" onClick={loadReviews}>
                  Load iOS Reviews
                </button>
              ) : iosReviewsLoading && iosReviews.length === 0 ? (
                <div className="sr-loading-text">Loading reviews…</div>
              ) : (
                <>
                  <div className="sr-reviews-list">
                    {iosReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                    {iosReviews.length === 0 && <p className="sr-empty-text">No reviews found.</p>}
                  </div>
                  {iosNextToken && (
                    <button
                      className="sr-load-more-btn"
                      onClick={loadMoreIos}
                      disabled={iosReviewsLoading}
                    >
                      {iosReviewsLoading ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Android */}
            <div className="sr-platform-col">
              <div className="sr-platform-header android">
                <span className="sr-platform-icon">🤖</span>
                <span className="sr-platform-label">Android</span>
                {latestSnap?.android && (
                  <span className="sr-platform-score">
                    ⭐ {latestSnap.android.score.toFixed(2)} · {latestSnap.android.ratingsCount.toLocaleString()} ratings
                  </span>
                )}
              </div>

              {latestSnap?.android?.histogram && (
                <StarBar histogram={latestSnap.android.histogram} />
              )}

              {!reviewsLoaded ? (
                <button className="sr-load-reviews-btn" onClick={loadReviews}>
                  Load Android Reviews
                </button>
              ) : androidReviewsLoading && androidReviews.length === 0 ? (
                <div className="sr-loading-text">Loading reviews…</div>
              ) : (
                <>
                  <div className="sr-reviews-list">
                    {androidReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                    {androidReviews.length === 0 && <p className="sr-empty-text">No reviews found.</p>}
                  </div>
                  {androidNextToken && (
                    <button
                      className="sr-load-more-btn"
                      onClick={loadMoreAndroid}
                      disabled={androidReviewsLoading}
                    >
                      {androidReviewsLoading ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
