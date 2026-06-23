import {
  WRAPPED_CUTOFF_DAY,
  WRAPPED_CUTOFF_MONTH,
  WRAPPED_TOP_N,
} from '../../analysis/filterPresets';
import { WRAPPED_LIMITATIONS } from '../../content/siteContent';
import { monthName } from '../../utils/formatting';
import type { AlbumStats, AnalysisResult, ArtistStats, SongStats } from '../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type WrappedRankingKind = 'songs' | 'artists' | 'albums';

interface WrappedRankingsViewProps {
  kind: WrappedRankingKind;
  analysis: AnalysisResult;
  year: number;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold">
      {rank}
    </span>
  );
}

function kindLabel(kind: WrappedRankingKind): string {
  if (kind === 'songs') return 'songs';
  if (kind === 'artists') return 'artists';
  return 'albums';
}

function rankingItems(
  kind: WrappedRankingKind,
  analysis: AnalysisResult,
): SongStats[] | ArtistStats[] | AlbumStats[] {
  if (kind === 'songs') {
    return analysis.topSongsByPlays.slice(0, WRAPPED_TOP_N);
  }
  if (kind === 'artists') {
    return analysis.topArtistsByPlays.slice(0, WRAPPED_TOP_N);
  }
  return analysis.topAlbumsByPlays.slice(0, WRAPPED_TOP_N);
}

export function WrappedRankingsView({ kind, analysis, year }: WrappedRankingsViewProps) {
  const items = rankingItems(kind, analysis);

  return (
    <section className="grid gap-5" aria-label={`Wrapped top ${kindLabel(kind)}`}>
      <header className="grid gap-1.5">
        <h2 className="text-[clamp(1.35rem,3vw,1.85rem)] font-bold tracking-tight">
          Your top {items.length || WRAPPED_TOP_N} {kindLabel(kind)}
        </h2>
        <p className="text-accent text-sm">
          {year} · Jan 1–{monthName(WRAPPED_CUTOFF_MONTH)} {WRAPPED_CUTOFF_DAY} · ranked by play count
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[46rem]">
          {WRAPPED_LIMITATIONS}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No {kindLabel(kind)} match the Wrapped rules for {year}.
        </p>
      ) : kind === 'songs' ? (
        <WrappedSongTable songs={items as SongStats[]} />
      ) : kind === 'artists' ? (
        <WrappedArtistTable artists={items as ArtistStats[]} />
      ) : (
        <WrappedAlbumTable albums={items as AlbumStats[]} />
      )}
    </section>
  );
}

function WrappedSongTable({ songs }: { songs: SongStats[] }) {
  return (
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
          {songs.map((song, index) => (
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
  );
}

function WrappedArtistTable({ artists }: { artists: ArtistStats[] }) {
  return (
    <div className="rounded-xl border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[3.2rem]">#</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead className="text-right">Plays</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.map((artist, index) => (
            <TableRow
              key={artist.artistName}
              className={cn(
                index === 0 &&
                  '[&_td:first-child_span]:bg-accent [&_td:first-child_span]:text-accent-foreground [&_td:first-child_span]:shadow-[0_0_14px_rgba(29,185,84,0.35)]',
              )}
            >
              <TableCell>
                <RankBadge rank={index + 1} />
              </TableCell>
              <TableCell className="font-semibold break-words">{artist.artistName}</TableCell>
              <TableCell className="text-right font-bold">
                {artist.listenCount.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WrappedAlbumTable({ albums }: { albums: AlbumStats[] }) {
  return (
    <div className="rounded-xl border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[3.2rem]">#</TableHead>
            <TableHead>Album</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead className="text-right">Plays</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album, index) => (
            <TableRow
              key={`${album.albumName}-${album.artistName}`}
              className={cn(
                index === 0 &&
                  '[&_td:first-child_span]:bg-accent [&_td:first-child_span]:text-accent-foreground [&_td:first-child_span]:shadow-[0_0_14px_rgba(29,185,84,0.35)]',
              )}
            >
              <TableCell>
                <RankBadge rank={index + 1} />
              </TableCell>
              <TableCell className="font-semibold break-words">{album.albumName}</TableCell>
              <TableCell className="text-muted-foreground break-words">{album.artistName}</TableCell>
              <TableCell className="text-right font-bold">{album.numPlays.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
