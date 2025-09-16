import { IconButton } from '@/shared/components/ui/IconButton';

interface DashboardHeaderProps {
  onUndo: () => void;
  canUndo: boolean;
  lastActionModifiesDatabase: boolean;
  lastActionDescription?: string;
}

export function DashboardHeader({
  onUndo,
  canUndo,
  lastActionModifiesDatabase
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 pt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Time/Date moved to floating component */}
        </div>
        <div className="flex gap-3">
          <IconButton
            onClick={onUndo}
            disabled={!canUndo}
            variant={lastActionModifiesDatabase ? 'warning' : 'secondary'}
            title={lastActionModifiesDatabase ? "Undo last action (affects database)" : "Undo last action"}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
