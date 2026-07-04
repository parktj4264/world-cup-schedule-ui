import { TOURNAMENT_SHEET_TABS, type SheetTabId } from './TournamentSheets';

export type WorkbookSheetId = 'all' | SheetTabId;

type WorkbookTabsProps = {
  activeSheetId: WorkbookSheetId;
  onSheetChange: (sheetId: WorkbookSheetId) => void;
};

type WorkbookTab = {
  id: WorkbookSheetId;
  label: string;
  kind: 'overview' | 'knockout';
};

const workbookTabs: WorkbookTab[] = [
  {
    id: 'all',
    label: '전체 일정',
    kind: 'overview',
  },
  ...TOURNAMENT_SHEET_TABS.map<WorkbookTab>((tab) => ({
    id: tab.id,
    label: tab.label,
    kind: 'knockout',
  })),
];

export function WorkbookTabs({ activeSheetId, onSheetChange }: WorkbookTabsProps) {
  return (
    <div className="workbook-tabs mx-auto w-full max-w-[980px]">
      <div className="workbook-tab-strip" role="tablist" aria-label="일정 시트 선택">
        {workbookTabs.map((tab) => {
          const isActive = tab.id === activeSheetId;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={[
                'workbook-tab',
                `workbook-tab-${tab.kind}`,
                isActive ? 'workbook-tab-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSheetChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
