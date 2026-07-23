// A/B Test Results tab (route /experiments/new, "Results" tab). Presentational
// mock dashboard: winner summary, recommendation, traffic split, avg delta,
// per-metric bar cards, and a resolutions time-series chart. No backend.
import { METRIC_CARDS } from './results-data'
import { WinnerCard } from './WinnerCard'
import { RecommendationCard } from './RecommendationCard'
import { TrafficSplitCard } from './TrafficSplitCard'
import { AvgDeltaCard } from './AvgDeltaCard'
import { MetricBarCard } from './MetricBarCard'
import { ResolutionsTimeSeriesCard } from './ResolutionsTimeSeriesCard'

const [deflection, ...restMetrics] = METRIC_CARDS

export function ResultsView() {
  return (
    <div data-testid="view-ab-test-results" className="flex flex-col gap-5 px-8 py-6">
      <div className="grid grid-cols-[348px_1fr] gap-5">
        <WinnerCard />
        <RecommendationCard />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <TrafficSplitCard />
        <AvgDeltaCard />
        <MetricBarCard card={deflection} />
        {restMetrics.map((card) => (
          <MetricBarCard key={card.key} card={card} />
        ))}
      </div>

      <ResolutionsTimeSeriesCard />
    </div>
  )
}
