type FilterBarProps = {
  selectedCountry: string;
  countryOptions: string[];
  onCountryChange: (country: string) => void;
  onClearCountry: () => void;
};

const buttonClassName =
  'border border-neutral-700 bg-white px-2 py-1 text-sm font-bold leading-none text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-white';

export function FilterBar({
  selectedCountry,
  countryOptions,
  onCountryChange,
  onClearCountry,
}: FilterBarProps) {
  const hasSelectedCountry = selectedCountry.trim() !== '';

  return (
    <div className="filter-bar mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-1 pb-2 pt-1">
      <span className="mr-1 text-sm font-black text-neutral-800">나라 선택</span>
      <input
        list="country-options"
        value={selectedCountry}
        onChange={(event) => onCountryChange(event.target.value)}
        className={[
          'h-[30px] w-40 border border-neutral-700 bg-white px-2 text-sm font-bold text-neutral-900',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600',
        ].join(' ')}
        placeholder="예: 대한민국"
      />
      <button
        type="button"
        onClick={onClearCountry}
        disabled={!hasSelectedCountry}
        className={buttonClassName}
      >
        선택 해제
      </button>
      <datalist id="country-options">
        {countryOptions.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </datalist>
    </div>
  );
}
