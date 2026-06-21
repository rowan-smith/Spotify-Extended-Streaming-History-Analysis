import { WRAPPED_TOP_N } from '../analysis/filters';
import { WRAPPED_LIMITATIONS } from '../content/siteContent';
import type { SongStats } from '../types';

interface WrappedTabProps {
  songs: SongStats[];
  spanLabel: string;
}

export function WrappedTab({ songs, spanLabel }: WrappedTabProps) {
  const topSongs = songs.slice(0, WRAPPED_TOP_N);

  return (
    <section className="wrapped-tab" aria-label="Wrapped top songs">
      <header className="wrapped-tab__header">
        <h2 className="wrapped-tab__title">
          Your top {topSongs.length} songs
        </h2>

        <p className="wrapped-tab__subtitle">
          {spanLabel} · Jan 1–Nov 15 · ranked by play count
        </p>

        <p className="wrapped-tab__footnote">
          {WRAPPED_LIMITATIONS}
        </p>
      </header>

      {topSongs.length === 0 ? (
        <p className="wrapped-tab__empty">
          No songs match your Wrapped filters.
        </p>
      ) : (
        <div className="data-table">
          <div className="data-table__scroll">
            <table className="wrapped-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Track</th>
                  <th>Artist</th>
                  <th className="align-right">Plays</th>
                </tr>
              </thead>

              <tbody>
                {topSongs.map((song, index) => (
                  <tr key={`${song.trackName}-${song.artistName}`}>
                    <td className="wrapped-table__rank">
                      <span>{index + 1}</span>
                    </td>

                    <td className="wrapped-table__track">
                      {song.trackName}
                    </td>

                    <td className="wrapped-table__artist">
                      {song.artistName}
                    </td>

                    <td className="wrapped-table__plays align-right">
                      {song.numPlays.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}