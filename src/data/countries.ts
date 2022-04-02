import atlas from './atlas.json';

export const enum Country {
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
  ESTONIA,
  LATVIA,
  LITHUANIAN,
  GREECE,
  ROMANIA,
  BULGARIA,
  CROATIA,
  BOSNIA_AND_HERZEGOVINA,
  SERBIA,
  ALBANIA,
  NORTH_MACEDONIA,
  MONTENEGRO,
  TURKEY,
  AUSTRALIA,
  INDIA,
  BANGLADESH,
  BELARUS,
  UKRAINE,
  MOLDOVA,
  RUSSIA,
  GEORGIA,
  ARMENIA,
  AZERBAIJAN,
  SAUDI_ARABIA,
  YEMEN,
  OMAN,
  UNITED_ARAB_EMIRATES,
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
  center: [number, number];
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
  center: [number, number];
  atlasData: AtlasEntry[];
};

type Countries = Map<Country, CountryInfo>;

const countriesInitial: Map<Country, CountryDetails> = new Map([
  [
    Country.ITALY,
    {
      color: 0x7e,
      title: 'Italy',
      center: [0.75, 0.2],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.FRANCE,
    {
      color: 0xa3,
      title: 'France',
      center: [0.86, 0.01],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.BELGIUM,
    {
      color: 0xad,
      title: 'Belgium',
      center: [0.96, 0.06],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.NETHERLANDS,
    {
      color: 0x4d,
      title: 'Netherlands',
      center: [0.99, 0.09],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.AUSTRIA,
    {
      color: 0xc9,
      title: 'Austria',
      center: [0.88, 0.22],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SWITZERLAND,
    {
      color: 0x6a,
      title: 'Switzerland',
      center: [0.87, 0.11],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.GERMANY,
    {
      color: 0xff,
      title: 'Germany',
      center: [0.95, 0.17],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.POLAND,
    {
      color: 0x90,
      title: 'Poland',
      center: [0.97, 0.33],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.CZECH,
    {
      color: 0x2e,
      title: 'Czech',
      center: [0.93, 0.24],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SLOVAKIA,
    {
      color: 0xb8,
      title: 'Slovakia',
      center: [0.9, 0.3],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SLOVENIA,
    {
      color: 0xb9,
      title: 'Slovenia',
      center: [0.85, 0.22],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.HUNGARY,
    {
      color: 0xe3,
      title: 'Hungary',
      center: [0.86, 0.3],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.FINLAND,
    {
      color: 0xa1,
      title: 'Finland',
      center: [1.18, 0.55],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SWEDEN,
    {
      color: 0x7c,
      title: 'Sweden',
      center: [1.16, 0.33],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.NORWAY,
    {
      color: 0x47, // actual 0x46
      title: 'Norway',
      center: [1.19, 0.25],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.DENMARK,
    {
      color: 0x5f,
      title: 'Denmark',
      center: [1.06, 0.2],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.SPAIN,
    {
      color: 0x76,
      title: 'Spain',
      center: [0.72, -0.1],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.PORTUGAL,
    {
      color: 0x8a,
      title: 'Portugal',
      center: [0.73, -0.18],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.ESTONIA,
    {
      color: 0xc5,
      title: 'ESTONIA',
      center: [1.1, 0.5],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.LATVIA,
    {
      color: 0x8e,
      title: 'Latvia',
      center: [1.07, 0.46],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.LITHUANIAN,
    {
      color: 0x31,
      title: 'Lithuania',
      center: [1.04, 0.44],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.GREECE,
    {
      color: 0x5d,
      title: 'Greece',
      center: [0.66, 0.35],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.CROATIA,
    {
      color: 0x49,
      title: 'Croatia',
      center: [0.82, 0.26],
      tags: [Tag.Europa, Tag.EuroUnion],
    },
  ],
  [
    Country.BOSNIA_AND_HERZEGOVINA,
    {
      color: 0xb0,
      title: 'Bosnia and Herzegovina',
      center: [0.8, 0.29],
      tags: [Tag.Europa],
    },
  ],
  [
    Country.SERBIA,
    {
      color: 0xa2,
      title: 'Serbia',
      center: [0.79, 0.34],
      tags: [Tag.Europa],
    },
  ],
  [
    Country.ALBANIA,
    {
      color: 0xa7,
      title: 'Albania',
      center: [0.72, 0.31],
      tags: [Tag.Europa],
    },
  ],
  [
    Country.NORTH_MACEDONIA,
    {
      color: 0xda,
      title: 'North Macedonia',
      center: [0.73, 0.35],
      tags: [Tag.Europa],
    },
  ],
  [
    Country.MONTENEGRO,
    {
      color: 0x55,
      title: 'Montenegro',
      center: [0.76, 0.3],
      tags: [Tag.Europa],
    },
  ],
  [
    Country.TURKEY,
    {
      color: 0x3a,
      title: 'Turkey',
      center: [0.68, 0.57],
      tags: [],
    },
  ],
  [
    Country.AUSTRALIA,
    {
      color: [0x83, 0x84],
      title: 'Australia',
      center: [-0.51, 2.26],
      tags: [],
    },
  ],
  [
    Country.INDIA,
    {
      color: 0x44,
      title: 'India',
      tags: [Tag.Asia],
      center: [0.3, 1.33],
    },
  ],
  [
    Country.BANGLADESH,
    {
      color: 0x88,
      title: 'Bangladesh',
      center: [0.31, 1.48],
      tags: [Tag.Asia],
    },
  ],
  [
    Country.BELARUS,
    {
      color: 0x65,
      title: 'Belarus',
      center: [0.98, 0.49],
      tags: [],
    },
  ],
  [
    Country.UKRAINE,
    {
      color: 0x1c,
      title: 'Ukraine',
      center: [0.89, 0.53],
      tags: [],
    },
  ],
  [
    Country.MOLDOVA,
    {
      color: 0x58,
      title: 'Moldova',
      center: [0.86, 0.48],
      tags: [],
    },
  ],
  [
    Country.ROMANIA,
    {
      color: 0xb3,
      title: 'Romania',
      center: [0.86, 0.48], // FIX
      tags: [],
    },
  ],
  [
    Country.BULGARIA,
    {
      color: 0x6c,
      title: 'Bulgaria',
      center: [0.86, 0.48], // FIX
      tags: [],
    },
  ],
  [
    Country.RUSSIA,
    {
      color: 0xf7, // 0xf6
      title: 'Russia',
      center: [1.08, 1.53],
      tags: [],
    },
  ],
  [
    Country.GEORGIA,
    {
      color: 0x89,
      title: 'Georgia',
      center: [0.75, 0.73],
      tags: [],
    },
  ],
  [
    Country.ARMENIA,
    {
      color: 0x75,
      title: 'Armenia',
      center: [0.71, 0.76],
      tags: [],
    },
  ],
  [
    Country.AZERBAIJAN,
    {
      color: 0xbf,
      title: 'Azerbaijan',
      center: [0.71, 0.8],
      tags: [],
    },
  ],
  [
    Country.SAUDI_ARABIA,
    {
      color: 0x92,
      title: 'Saudi Arabia',
      center: [0.39, 0.71],
      tags: [],
    },
  ],
  [
    Country.YEMEN,
    {
      color: 0x63,
      title: 'Yemen',
      center: [0.25, 0.76],
      tags: [],
    },
  ],
  [
    Country.OMAN,
    {
      color: 0xe0,
      title: 'Oman',
      center: [0.3, 0.95],
      tags: [],
    },
  ],
  [
    Country.UNITED_ARAB_EMIRATES,
    {
      color: 0x2a,
      title: 'United Arab Emirates',
      center: [0.36, 0.92],
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
      center: info.center,
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
