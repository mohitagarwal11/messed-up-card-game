import type { Player } from '../../../shared/types/index';
import { LetterAvatar } from './LetterAvatar';

export function PlayerCard({ player }: { player: Player }) {
  const isDisconnected = player.status === 'disconnected';

  return (
    <article
      className={`border-2 px-8 py-3 transition-colors ${
        isDisconnected ? 'border-border bg-secondary opacity-70' : 'border-primary bg-card'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-[2.5fr_1fr_1.5fr] md:items-center">
          {/* Name col */}
          <div className="flex items-center gap-4">
            <LetterAvatar name={player.name} isHost={player.isHost} />
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-xs uppercase text-secondary-foreground">Player</p>
              <div className="flex items-center gap-2">
                <p
                  className={`truncate text-lg font-bold xl:text-xl ${
                    isDisconnected ? 'text-secondary-foreground' : 'text-primary'
                  }`}
                >
                  {player.name}
                </p>
                {player.isHost && (
                  <span className="hrink-0 bg-primary px-1.5 py-0.5 text-[8px] text-primary-foreground">
                    HOST
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Points col */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase text-secondary-foreground">Points</p>
            <p
              className={`text-xl font-bold ${
                isDisconnected ? 'text-secondary-foreground' : 'text-primary'
              }`}
            >
              {player.score}
            </p>
          </div>

          {/* Status col */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase text-secondary-foreground">Status</p>
            <p
              className={`text-base uppercase ${
                isDisconnected ? 'text-destructive' : 'text-primary'
              }`}
            >
              {isDisconnected ? 'OFFLINE' : 'ONLINE'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
