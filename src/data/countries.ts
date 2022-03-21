import atlas from './atlas.json';

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
  SPAIN,
  PORTUGAL,
  CROATIA,
  BOSNIA_AND_HERZEGOVINA,
  SERBIA,
  AUSTRALIA,
  INDIA,
  BANGLADESH,
  RUSSIA,
}

enum Tag {
  EuroUnion = 1,
  Europa,
  Asia,
  America,
}

type CountryDetails = {
  color: number | number[];
  title: string;
  tags: Tag[];
};

type AtlasEntry = {
  color: number;
  srcX: number;
  srcY: number;
  width: number;
  height: number;
  uv1: {
    u: number;
    v: number;
  };
  uv2: {
    u: number;
    v: number;
  };
};

export type CountryInfo = Omit<CountryDetails, 'color'> & {
  id: Country;
  colors: number[];
  atlasData: AtlasEntry[];
};

type Countries = Map<Country, CountryInfo>;

const countriesInitial: Map<Country, CountryDetails> = new Map([
  [
    Country.ITALY,
    {
      color: 0x7e,
      title: 'Italy',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.FRANCE,
    {
      color: 0xa3,
      title: 'France',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.BELGIUM,
    {
      color: 0xad,
      title: 'Belgium',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.NETHERLANDS,
    {
      color: 0x4d,
      title: 'Netherlands',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.AUSTRIA,
    {
      color: 0xc9,
      title: 'Austria',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SWITZERLAND,
    {
      color: 0x6a,
      title: 'Switzerland',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.GERMANY,
    {
      color: 0xff,
      title: 'Germany',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.POLAND,
    {
      color: 0x90,
      title: 'Poland',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.CZECH,
    {
      color: 0x2e,
      title: 'Czech',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SLOVAKIA,
    {
      color: 0xb8,
      title: 'Slovakia',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SLOVENIA,
    {
      color: 0xb9,
      title: 'Slovenia',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.HUNGARY,
    {
      color: 0xe3,
      title: 'Hungary',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.FINLAND,
    {
      color: 0xa1,
      title: 'Finland',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SWEDEN,
    {
      color: 0x7c,
      title: 'Sweden',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.NORWAY,
    {
      color: 0x47, // actual 0x46
      title: 'Norway',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.DENMARK,
    {
      color: 0x5f,
      title: 'Denmark',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SPAIN,
    {
      color: 0x76,
      title: 'Spain',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.PORTUGAL,
    {
      color: 0x8a,
      title: 'Portugal',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.CROATIA,
    {
      color: 0x49,
      title: 'Croatia',
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.BOSNIA_AND_HERZEGOVINA,
    {
      color: 0xb0,
      title: 'Bosnia and Herzegovina',
      tags: [Tag.Europa],
    },
  ],
  [
    Country.SERBIA,
    {
      color: 0xa2,
      title: 'Serbia',
      tags: [Tag.Europa],
    },
  ],
  [
    Country.AUSTRALIA,
    {
      color: [0x83, 0x84],
      title: 'Australia',
      tags: [],
    },
  ],
  [
    Country.INDIA,
    {
      color: 0x44,
      title: 'India',
      tags: [Tag.Asia],
    },
  ],
  [
    Country.BANGLADESH,
    {
      color: 0x88,
      title: 'Bangladesh',
      tags: [Tag.Asia],
    },
  ],
  [
    Country.RUSSIA,
    {
      color: 0xf7, // 0xf6
      title: 'Russia',
      tags: [],
    },
  ],
]);

// @ts-ignore
export const countries = [...countriesInitial.entries()].reduce<Countries>(
  (acc, [id, info]: [Country, CountryDetails]) => {
    const colors = Array.isArray(info.color) ? info.color : [info.color];

    const atlasData = colors.map((color) => {
      const data = atlas.countries.find((atlasEntry) => atlasEntry.color === color);
      if (!data) {
        throw new Error('No country atlas data');
      }
      return data;
    });

    acc.set(id, {
      id,
      title: info.title,
      tags: info.tags,
      colors,
      atlasData,
    });
    return acc;
  },
  new Map(),
);

export const countriesByColor: Map<number, Country> = new Map();

for (const [countryId, country] of countries.entries() as any) {
  for (const color of country.colors) {
    countriesByColor.set(color, countryId);
  }
}

export function getRandomCountryExcept(ignoreCountries: Country[]): CountryInfo | undefined {
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
