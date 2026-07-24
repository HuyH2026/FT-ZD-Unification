// A/B Test Results tab. Presentational mock dashboard driven by one
// ExperimentDetail: winner summary, recommendation, traffic split, avg delta,
// per-metric bar cards, and a resolutions time-series chart. No backend.
import { type ExperimentDetail } from './results-data'
import { WinnerCard } from './WinnerCard'
import { RecommendationCard } from './RecommendationCard'
import { TrafficSplitCard } from './TrafficSplitCard'
import { AvgDeltaCard } from './AvgDeltaCard'
import { MetricBarCard } from './MetricBarCard'
import { ResolutionsTimeSeriesCard } from './ResolutionsTimeSeriesCard'

export function ResultsView({ detail }: { detail: ExperimentDetail }) {
  const [deflection, ...restMetrics] = detail.metricCards
  return (
    <div data-testid="view-ab-test-results" className="flex flex-col gap-6 px-8 py-6">
      <div className="grid grid-cols-[348px_1fr] gap-5">
        <WinnerCard winnerLabel={detail.winnerLabel} variants={detail.winnerVariants} />
        <RecommendationCard recommendation={detail.recommendation} keyLearning={detail.keyLearning} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <TrafficSplitCard splits={detail.trafficSplit} total={detail.trafficSplitTotal} />
        <AvgDeltaCard entries={detail.avgDelta} />
        {deflection && <MetricBarCard card={deflection} />}
        {restMetrics.map((card) => (
          <MetricBarCard key={card.key} card={card} />
        ))}
      </div>

      <ResolutionsTimeSeriesCard series={detail.resolutionsSeries} />
    </div>
  )
}
