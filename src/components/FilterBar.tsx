export type FilterMode = 'all' | 'today';

type FilterBarProps = {
  activeFilter: FilterMode;
  selectedCountry: string;
  countryOptions: string[];
  onFilterChange: (filter: FilterMode) => void;
  onCountryChange: (country: string) => void;
  onClearCountry: () => void;
};

const filters: Array<{ label: string; value: FilterMode }> = [
  { label: '전체', value: 'all' },
  { label: '오늘', value: 'today' },
];

export function FilterBar({
  activeFilter,
  selectedCountry,
  countryOptions,
  onFilterChange,
  onCountryChange,
  onClearCountry,
}: FilterBarProps) {
  const hasSelectedCountry = selectedCountry.trim() !== '';

  return (
    <div className="filter-bar mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-1 py-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value && selectedCountry === '';

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              onCountryChange('');
              onFilterChange(filter.value);
            }}
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
      <label className="ml-1 flex items-center gap-1 text-sm font-bold text-neutral-800">
        나라 검색
        <input
          list="country-options"
          value={selectedCountry}
          onChange={(event) => {
            onCountryChange(event.target.value);
            onFilterChange('all');
          }}
          className={[
            'h-[30px] w-36 border border-neutral-700 bg-white px-2 text-sm font-bold text-neutral-900',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600',
          ].join(' ')}
          placeholder="예: 대한민국"
        />
        <datalist id="country-options">
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </datalist>
      </label>
      {hasSelectedCountry ? (
        <button
          type="button"
          onClick={onClearCountry}
          className={[
            'border border-neutral-700 bg-white px-2 py-1 text-sm font-bold leading-none text-neutral-900',
            'hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600',
          ].join(' ')}
        >
          선택 해제
        </button>
      ) : null}
    </div>
  );
}
