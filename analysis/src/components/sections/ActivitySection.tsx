import { Card, CardContent } from '@/components/ui/card';
import { METRIC_INFO } from '../../content/siteContent';
import type { AnalysisFilters, AnalysisResult } from '../../types';
import { StatCard } from '../StatCard';

interface ActivitySectionProps {
  overview: AnalysisResult['overview'];
  filters: AnalysisFilters;
}

export function ActivitySection({ overview, filters }: ActivitySectionProps) {
  const showSkipMetrics = !filters.hideSkipped;
  const completionTotal = overview.totalCompleted + overview.totalSkipped;
  const completionPct =
    completionTotal > 0 ? Math.round((overview.totalCompleted / completionTotal) * 100) : 100;
  const showCompletionBar = showSkipMetrics && overview.totalSkipped > 0;

  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">Play activity</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0">
        <StatCard
          label="Completed listens"
          value={overview.totalCompleted.toLocaleString()}
          info={METRIC_INFO.completedListens}
        />
        {showSkipMetrics ? (
          <StatCard
            label="Skipped plays"
            value={overview.totalSkipped.toLocaleString()}
            info={METRIC_INFO.skippedPlays}
          />
        ) : null}
        <StatCard
          label="Avg plays / day"
          value={overview.avgPlaysPerDay.toFixed(1)}
          info={METRIC_INFO.avgPlaysPerDay}
        />
        <StatCard
          label="Avg completed / day"
          value={overview.avgCompletedPerDay.toFixed(1)}
          info={METRIC_INFO.avgCompletedPerDay}
        />
        {showSkipMetrics ? (
          <StatCard
            label="Avg skipped / day"
            value={overview.avgSkippedPerDay.toFixed(1)}
            info={METRIC_INFO.avgSkippedPerDay}
          />
        ) : null}
      </div>
      {showCompletionBar ? (
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
              <span>Completed vs skipped</span>
              <span>{completionPct}% completed</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${completionPct}%` }} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
