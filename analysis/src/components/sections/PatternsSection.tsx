import type { Theme } from '../../hooks/useTheme';
import {
  lineChart,
  multiYearLineSeries,
  verticalBarChart,
} from '../../charts/plotHelpers';
import type { AnalysisResult } from '../../types';
import { PlotlyCard } from '../charts/PlotlyCard';

interface PatternsSectionProps {
  analysis: AnalysisResult;
  theme: Theme;
  showMultiYearCharts: boolean;
}

export function PatternsSection({
  analysis,
  theme,
  showMultiYearCharts,
}: PatternsSectionProps) {
  return (
    <>
      <PlotlyCard
        title="Plays by month (in range)"
        subtitle="All Januaries, Februaries, etc. pooled across your filtered history."
        data={[
          verticalBarChart(
            analysis.playsByMonth.map((point) => point.label),
            analysis.playsByMonth.map((point) => point.value),
            analysis.playsByMonth.map((point) => point.topItem ?? ''),
            'Plays',
          ),
        ]}
        layout={{ xaxis: { title: { text: 'Month' } }, yaxis: { title: { text: 'Plays' } } }}
        theme={theme}
        height={360}
      />

      <PlotlyCard
        title="Playtime by month (in range)"
        subtitle="All Januaries, Februaries, etc. pooled across your filtered history."
        data={[
          verticalBarChart(
            analysis.hoursByMonth.map((point) => point.label),
            analysis.hoursByMonth.map((point) => point.value),
            analysis.hoursByMonth.map((point) => point.topItem ?? ''),
            'Hours',
          ),
        ]}
        layout={{ xaxis: { title: { text: 'Month' } }, yaxis: { title: { text: 'Hours' } } }}
        theme={theme}
        height={360}
      />

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
      />

      {showMultiYearCharts && analysis.monthlyHistoryByYear.length > 1 ? (
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
        />
      ) : null}
    </>
  );
}
