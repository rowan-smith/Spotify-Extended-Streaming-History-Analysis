import { WRAPPED_TOP_N } from '../../analysis/filterPresets';
import { WRAPPED_LIMITATIONS } from '../../content/siteContent';
import type { SongStats } from '../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface WrappedTabProps {
  songs: SongStats[];
  spanLabel: string;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold">
      {rank}
    </span>
  );
}

export function WrappedTab({ songs, spanLabel }: WrappedTabProps) {
  const topSongs = songs.slice(0, WRAPPED_TOP_N);

  return (
    <section className="grid gap-5" aria-label="Wrapped top songs">
      <header className="grid gap-1.5">
        <h2 className="text-[clamp(1.35rem,3vw,1.85rem)] font-bold tracking-tight">
          Your top {topSongs.length} songs
        </h2>

        <p className="text-accent text-sm">
          {spanLabel} · Jan 1–Nov 15 · ranked by play count
        </p>

        <p className="text-xs text-muted-foreground leading-relaxed max-w-[46rem]">
          {WRAPPED_LIMITATIONS}
        </p>
      </header>

      {topSongs.length === 0 ? (
        <p className="text-muted-foreground">
          No songs match your Wrapped filters.
        </p>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[3.2rem]">#</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className="text-right">Plays</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSongs.map((song, index) => (
                <TableRow
                  key={`${song.trackName}-${song.artistName}`}
                  className={cn(
                    index === 0 &&
                      '[&_td:first-child_span]:bg-accent [&_td:first-child_span]:text-accent-foreground [&_td:first-child_span]:shadow-[0_0_14px_rgba(29,185,84,0.35)]',
                  )}
                >
                  <TableCell>
                    <RankBadge rank={index + 1} />
                  </TableCell>
                  <TableCell className="font-semibold break-words">{song.trackName}</TableCell>
                  <TableCell className="text-muted-foreground break-words">{song.artistName}</TableCell>
                  <TableCell className="text-right font-bold">{song.numPlays.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
