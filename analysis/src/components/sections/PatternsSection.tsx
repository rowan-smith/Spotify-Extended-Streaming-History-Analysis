import { useMemo } from 'react';
import type { Theme } from '../../hooks/useTheme';
import {
  lineChart,
  multiYearLineSeries,
  verticalBarChart,
} from '../../charts/plotHelpers';
import type { AnalysisResult, RankingMetric, TimelinePoint } from '../../types';
import { PlotlyCard } from '../charts/PlotlyCard';
import { FancyRankedListPanel } from '../charts/FancyRankedListPanel';

interface PatternsSectionProps {
  analysis: AnalysisResult;
  rankingMetric: RankingMetric;
  theme: Theme;
  showYearlyTopBreakdown: boolean;
}

export function PatternsSection({
  analysis,
  rankingMetric,
  theme,
  showYearlyTopBreakdown,
}: PatternsSectionProps) {
  const monthlyHistoryPoints = useMemo<TimelinePoint[]>(
    () =>
      analysis.monthlyHistoryByYear.flatMap((series) =>
        series.points.map((point) => ({
          label: `${series.year} ${point.label}`,
          value: point.value,
          topItem: point.topItem,
        })),
      ),
    [analysis.monthlyHistoryByYear],
  );

  const monthPoints = rankingMetric === 'plays' ? analysis.playsByMonth : analysis.hoursByMonth;
  const monthTitle =
    rankingMetric === 'plays' ? 'Plays by month (in range)' : 'Playtime by month (in range)';
  const monthYAxis = rankingMetric === 'plays' ? 'Plays' : 'Hours';
  const monthValueLabel = rankingMetric === 'plays' ? 'Plays' : 'Hours';

  return (
    <>
      <PlotlyCard
        title={monthTitle}
        subtitle="All Januaries, Februaries, etc. pooled across your filtered history."
        data={[
          verticalBarChart(
            monthPoints.map((point) => point.label),
            monthPoints.map((point) => point.value),
            monthPoints.map((point) => point.topItem ?? ''),
            monthValueLabel,
          ),
        ]}
        layout={{ xaxis: { title: { text: 'Month' } }, yaxis: { title: { text: monthYAxis } } }}
        theme={theme}
        height={360}
        points={monthPoints}
        pointsValueLabel={monthValueLabel}
      />

      {rankingMetric === 'plays' ? (
        <>
          <PlotlyCard
            title="Plays by day of month (in range)"
            subtitle="All 1sts, 2nds, etc. pooled across your filtered history."
            data={[
              lineChart(
                analysis.playsByDayOfMonth.map((point) => point.label),
                analysis.playsByDayOfMonth.map((point) => point.value),
                analysis.playsByDayOfMonth.map((point) => point.topItem ?? ''),
                'Plays',
              ),
            ]}
            layout={{ xaxis: { title: { text: 'Day of month' } }, yaxis: { title: { text: 'Plays' } } }}
            theme={theme}
            height={360}
            points={analysis.playsByDayOfMonth}
            pointsValueLabel="Plays"
          />

          <PlotlyCard
            title="Plays by hour of day (local time)"
            data={[
              verticalBarChart(
                analysis.playsByHour.map((point) => point.label),
                analysis.playsByHour.map((point) => point.value),
                analysis.playsByHour.map((point) => point.topItem ?? ''),
                'Plays',
              ),
            ]}
            layout={{ xaxis: { title: { text: 'Hour (local)' }, tickangle: -45 }, yaxis: { title: { text: 'Plays' } } }}
            theme={theme}
            height={360}
            points={analysis.playsByHour}
            pointsValueLabel="Plays"
          />

          <PlotlyCard
            title="Plays by day of week (local time)"
            subtitle="All Mondays, Tuesdays, etc. pooled across your filtered history, in your local time zone."
            data={[
              verticalBarChart(
                analysis.playsByDayOfWeek.map((point) => point.label),
                analysis.playsByDayOfWeek.map((point) => point.value),
                analysis.playsByDayOfWeek.map((point) => point.topItem ?? ''),
                'Plays',
              ),
            ]}
            layout={{ xaxis: { title: { text: 'Weekday' } }, yaxis: { title: { text: 'Plays' } } }}
            theme={theme}
            height={360}
            points={analysis.playsByDayOfWeek}
            pointsValueLabel="Plays"
          />
        </>
      ) : null}

      {showYearlyTopBreakdown ? (
        <PlotlyCard
          title="Listening history over the years"
          subtitle="Monthly playtime by calendar year. Each line is one year in your filtered data."
          data={multiYearLineSeries(analysis.monthlyHistoryByYear, 'Hours')}
          layout={{
            xaxis: { title: { text: 'Month' } },
            yaxis: { title: { text: 'Hours' } },
            legend: { orientation: 'h', y: 1.15 },
          }}
          theme={theme}
          height={420}
          points={monthlyHistoryPoints}
          pointsValueLabel="Hours"
          listView={
            <FancyRankedListPanel
              metricLabel="Hours"
              searchPlaceholder="Filter months…"
              items={monthlyHistoryPoints.map((point) => ({
                primary: point.label,
                secondary: point.topItem,
                value: point.value,
                valueText: point.value.toLocaleString(),
              }))}
            />
          }
        />
      ) : null}
    </>
  );
}
