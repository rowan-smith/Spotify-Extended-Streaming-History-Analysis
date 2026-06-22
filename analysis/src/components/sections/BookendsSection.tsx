import { METRIC_INFO } from '../../content/siteContent';
import type { AnalysisResult } from '../../types';
import { formatLocalDateTime, formatSessionLength } from '../../utils/formatting';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InfoTooltip } from '@/components/InfoTooltip';

interface BookendsSectionProps {
  overview: AnalysisResult['overview'];
}

export function BookendsSection({ overview }: BookendsSectionProps) {
  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">First & latest listens</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Earliest listen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.earliest ? (
              <>
                <p className="font-bold leading-tight break-words">{overview.earliest.trackName}</p>
                <p className="mt-1 text-sm text-muted-foreground break-words">{overview.earliest.artistName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatLocalDateTime(overview.earliest.ts)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Latest listen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.latest ? (
              <>
                <p className="font-bold leading-tight break-words">{overview.latest.trackName}</p>
                <p className="mt-1 text-sm text-muted-foreground break-words">{overview.latest.artistName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatLocalDateTime(overview.latest.ts)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Session habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[2.4rem]">
                  Skip ratio
                  <InfoTooltip text={METRIC_INFO.skipToCompleteRatio} label="Skip ratio" />
                </p>
                <p className="text-xl font-bold leading-tight">{overview.skipToCompleteRatio.toFixed(2)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[2.4rem]">
                  Avg session
                  <InfoTooltip text={METRIC_INFO.avgSessionLength} label="Average session length" />
                </p>
                <p className="text-xl font-bold leading-tight">
                  {formatSessionLength(overview.avgSessionSeconds)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
