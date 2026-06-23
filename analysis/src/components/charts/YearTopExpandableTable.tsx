import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatHours } from '../../utils/formatting';
import type { SongStats } from '../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  yearTopEntryKey,
  YEAR_TOP_ENTITY_LABELS,
  type YearTopEntry,
  type YearTopLabelKey,
} from './yearTopBreakdown';

interface YearTopExpandableTableProps {
  entries: YearTopEntry[];
  labelKey: YearTopLabelKey;
  songBreakdowns: Map<string, SongStats[]>;
}

export function YearTopExpandableTable({
  entries,
  labelKey,
  songBreakdowns,
}: YearTopExpandableTableProps) {
  const [query, setQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const entity = YEAR_TOP_ENTITY_LABELS[labelKey];
  const showArtistColumn = labelKey === 'albumName';
  const breakdownLabel = labelKey === 'albumName' ? 'Songs on this album' : 'Songs by this artist';

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;

    return entries.filter((entry) => {
      const haystack = [String(entry.year), entry.name, entry.detail ?? ''].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [entries, query]);

  function toggleExpanded(key: string) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <Input
          type="search"
          className="max-w-sm"
          value={query}
          placeholder="Filter years…"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {filteredEntries.length.toLocaleString()} row{filteredEntries.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" aria-label="Expand" />
              <TableHead className="text-right">Year</TableHead>
              <TableHead>{entity.column}</TableHead>
              {showArtistColumn ? <TableHead>Artist</TableHead> : null}
              <TableHead className="text-right">Plays</TableHead>
              <TableHead className="text-right">Playtime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showArtistColumn ? 6 : 5} className="text-center text-muted-foreground">
                  No rows match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => {
                const key = yearTopEntryKey(entry);
                const songs = songBreakdowns.get(key) ?? [];
                const expanded = expandedKeys.has(key);
                const canExpand = songs.length > 0;

                return (
                  <Fragment key={key}>
                    <TableRow>
                      <TableCell className="py-2">
                        {canExpand ? (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer"
                            aria-expanded={expanded}
                            aria-label={`${expanded ? 'Hide' : 'Show'} ${breakdownLabel.toLowerCase()} for ${entry.name}`}
                            onClick={() => toggleExpanded(key)}
                          >
                            {expanded ? (
                              <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{entry.year}</TableCell>
                      <TableCell className="font-medium break-words">{entry.name}</TableCell>
                      {showArtistColumn ? (
                        <TableCell className="text-muted-foreground break-words">{entry.detail ?? '—'}</TableCell>
                      ) : null}
                      <TableCell className="text-right tabular-nums">{entry.plays.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatHours(entry.hours)}</TableCell>
                    </TableRow>
                    {expanded && canExpand ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={showArtistColumn ? 6 : 5} className="p-0 bg-muted/30">
                          <div className="px-4 py-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{breakdownLabel}</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Track</TableHead>
                                  <TableHead className="text-right">Plays</TableHead>
                                  <TableHead className="text-right">Playtime</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {songs.map((song) => (
                                  <TableRow key={`${song.trackName}-${song.artistName}`}>
                                    <TableCell className="break-words">{song.trackName}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                      {song.numPlays.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                      {formatHours(song.totalHours)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
