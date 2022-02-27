export enum Country {
  ITALY,
  FRANCE,
  BELGIUM,
  NETHERLANDS,
  AUSTRIA,
  SWITZERLAND,
  GERMANY,
  POLAND,
  CZECH,
  SLOVAKIA,
  SLOVENIA,
  HUNGARY,
  FINLAND,
  SWEDEN,
  NORWAY,
}

type CountryDetails = {
  color: number;
  title: string;
};

export type CountryInfo = CountryDetails & {
  id: Country;
};

type Countries = Record<Country, CountryDetails>;

export const countries: Countries = {
  [Country.ITALY]: {
    color: 0x7e,
    title: 'Italy',
  },
  [Country.FRANCE]: {
    color: 0xa3,
    title: 'France',
  },
  [Country.BELGIUM]: {
    color: 0xad,
    title: 'Belgium',
  },
  [Country.NETHERLANDS]: {
    color: 0x4d,
    title: 'Netherlands',
  },
  [Country.AUSTRIA]: {
    color: 0xc9,
    title: 'Austria',
  },
  [Country.SWITZERLAND]: {
    color: 0x6a,
    title: 'Switzerland',
  },
  [Country.GERMANY]: {
    color: 0xff,
    title: 'Germany',
  },
  [Country.POLAND]: {
    color: 0x90,
    title: 'Poland',
  },
  [Country.CZECH]: {
    color: 0x2e,
    title: 'Czech',
  },
  [Country.SLOVAKIA]: {
    color: 0xb8,
    title: 'Slovakia',
  },
  [Country.SLOVENIA]: {
    color: 0x6a,
    title: 'Slovenia',
  },
  [Country.HUNGARY]: {
    color: 0xe3,
    title: 'Hungary',
  },
  [Country.FINLAND]: {
    color: 0xa1,
    title: 'Finland',
  },
  [Country.SWEDEN]: {
    color: 0x7c,
    title: 'Sweden',
  },
  [Country.NORWAY]: {
    color: 0x45,
    title: 'Norway',
  },
};

export const countriesByColor: Map<number, Country> = new Map(
  Object.entries(countries).map(([countryId, data]) => [
    data.color,
    countryId as unknown as Country,
  ]),
);

export function getRandomCountry(): CountryInfo {
  const list = [...Object.entries(countries)];
  const [countryId, info] = list[Math.floor(Math.random() * list.length)];

  return {
    id: countryId as unknown as Country,
    ...info,
  };
}
