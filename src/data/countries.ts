export enum Country {
  ITALY = 1,
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
  DENMARK,
}

type CountryDetails = {
  color: number;
  title: string;
};

export type CountryInfo = CountryDetails & {
  id: Country;
};

type Countries = Map<Country, CountryInfo>;

const countriesInitial: Map<Country, CountryDetails> = new Map([
  [
    Country.ITALY,
    {
      color: 0x7e,
      title: 'Italy',
    },
  ],
  [
    Country.FRANCE,
    {
      color: 0xa3,
      title: 'France',
    },
  ],
  [
    Country.BELGIUM,
    {
      color: 0xad,
      title: 'Belgium',
    },
  ],
  [
    Country.NETHERLANDS,
    {
      color: 0x4d,
      title: 'Netherlands',
    },
  ],
  [
    Country.AUSTRIA,
    {
      color: 0xc9,
      title: 'Austria',
    },
  ],
  [
    Country.SWITZERLAND,
    {
      color: 0x6a,
      title: 'Switzerland',
    },
  ],
  [
    Country.GERMANY,
    {
      color: 0xff,
      title: 'Germany',
    },
  ],
  [
    Country.POLAND,
    {
      color: 0x90,
      title: 'Poland',
    },
  ],
  [
    Country.CZECH,
    {
      color: 0x2e,
      title: 'Czech',
    },
  ],
  [
    Country.SLOVAKIA,
    {
      color: 0xb8,
      title: 'Slovakia',
    },
  ],
  [
    Country.SLOVENIA,
    {
      color: 0xb9,
      title: 'Slovenia',
    },
  ],
  [
    Country.HUNGARY,
    {
      color: 0xe3,
      title: 'Hungary',
    },
  ],
  [
    Country.FINLAND,
    {
      color: 0xa1,
      title: 'Finland',
    },
  ],
  [
    Country.SWEDEN,
    {
      color: 0x7c,
      title: 'Sweden',
    },
  ],
  [
    Country.NORWAY,
    {
      color: 0x47, // actual 0x46
      title: 'Norway',
    },
  ],
  [
    Country.DENMARK,
    {
      color: 0x5f,
      title: 'Denmark',
    },
  ],
]);

// @ts-ignore
export const countries = [...countriesInitial.entries()].reduce<Countries>(
  (acc, [id, info]) => {
    acc.set(id, {
      id,
      ...info,
    });
    return acc;
  },
  new Map(),
);

export const countriesByColor: Map<number, Country> = new Map(
  // @ts-ignore
  [...countries.entries()].map(([countryId, data]) => [
    data.color,
    countryId as unknown as Country,
  ]),
);

export function getRandomCountryExcept(
  ignoreCountries: Country[],
): CountryInfo | undefined {
  // @ts-ignore
  let list = [...countries.values()];

  list = list.filter((country) => !ignoreCountries.includes(country.id));

  if (list.length === 0) {
    return undefined;
  }

  return list[Math.floor(Math.random() * list.length)];
}

export function getCountryByColor(color: number): Country | undefined {
  return countriesByColor.get(color);
}
