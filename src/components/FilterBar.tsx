export type FilterMode = 'all' | 'korea' | 'today';

type FilterBarProps = {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
};

const filters: Array<{ label: string; value: FilterMode }> = [
  { label: '전체', value: 'all' },
  { label: '한국', value: 'korea' },
  { label: '오늘', value: 'today' },
];

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="mx-auto flex w-full max-w-[980px] items-center gap-1 py-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={[
              'min-w-14 border px-3 py-1 text-sm font-bold leading-none text-neutral-900',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600',
              isActive
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-700 bg-white hover:bg-neutral-100',
            ].join(' ')}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
