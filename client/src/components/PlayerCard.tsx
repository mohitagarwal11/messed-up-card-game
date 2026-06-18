import type { Player } from '../../../shared/types/index';
import { LetterAvatar } from './LetterAvatar';

export function PlayerCard({ player }: { player: Player }) {
  const isDisconnected = player.status === 'disconnected';

  return (
    <article
      className={`border-2 px-8 py-3 transition-colors ${
        isDisconnected
          ? 'border-outline bg-surface-container-low opacity-70'
          : 'border-primary bg-surface-container'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-[2.5fr_1fr_1.5fr] md:items-center">
          {/* Name col */}
          <div className="flex items-center gap-4">
            <LetterAvatar name={player.name} isHost={player.isHost} />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-mono-ui text-xs uppercase text-secondary">Player</p>
              <div className="flex items-center gap-2">
                <p
                  className={`truncate font-body text-lg font-bold xl:text-xl ${isDisconnected ? 'text-secondary' : 'text-primary'}`}
                >
                  {player.name}
                </p>
                {player.isHost && (
                  <span className="flex-shrink-0 bg-primary-container px-1.5 py-0.5 font-mono-ui text-[8px] text-on-primary">
                    HOST
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Points col */}
          <div className="flex flex-col gap-2">
            <p className="font-mono-ui text-xs uppercase text-secondary">Points</p>
            <p
              className={`font-body text-xl font-bold ${isDisconnected ? 'text-secondary' : 'text-primary'}`}
            >
              {player.score}
            </p>
          </div>

          {/* Status col */}
          <div className="flex flex-col gap-2">
            <p className="font-mono-ui text-xs uppercase text-secondary">Status</p>
            <p
              className={`font-mono-ui text-base uppercase ${isDisconnected ? 'text-error' : 'text-primary-container'}`}
            >
              {isDisconnected ? 'OFFLINE' : 'ONLINE'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
