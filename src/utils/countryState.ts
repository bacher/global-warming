import type {Country} from '../data/countries';
import type {CountryState} from './types';

type Params = {
  selectedCountryId: Country | undefined;
  successCountryIds: Country[];
  failedCountryIds: Country[];
};

export function getCountryStates({
  selectedCountryId,
  successCountryIds,
  failedCountryIds,
}: Params): CountryState[] {
  let isSelectedFound = false;

  const successPart: CountryState[] = successCountryIds.map((countryId) => {
    isSelectedFound =
      !isSelectedFound && Boolean(selectedCountryId) && countryId === selectedCountryId;

    return {
      countryId,
      color: isSelectedFound ? [0, 1, 0, 1] : [0, 0.7, 0, 1],
    };
  });

  const failedPart: CountryState[] = failedCountryIds.map((countryId) => {
    isSelectedFound =
      !isSelectedFound && Boolean(selectedCountryId) && countryId === selectedCountryId;

    return {
      countryId,
      color: isSelectedFound ? [1, 0, 0, 1] : [0.7, 0, 0, 1],
    };
  });

  const selectedPart: CountryState[] =
    selectedCountryId && !isSelectedFound
      ? [{countryId: selectedCountryId, color: [1, 0.64, 0, 1]}]
      : [];

  return [...successPart, ...failedPart, ...selectedPart];
}
