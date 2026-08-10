import type { Region, RegionId } from './types';

export const REGIONS: readonly Region[] = [
  { id: 'africa', label: 'Africa' },
  { id: 'south-america', label: 'South America' },
  { id: 'north-america', label: 'North America' },
  { id: 'uk-ireland', label: 'UK & Ireland' },
  { id: 'western-europe', label: 'Western Europe' },
  { id: 'southern-europe', label: 'Southern Europe' },
  { id: 'eastern-europe', label: 'Eastern Europe' },
  { id: 'nordic', label: 'Nordic' },
  { id: 'asia-oceania', label: 'Asia & Oceania' },
] as const;

const BY_ID = new Map<RegionId, Region>(REGIONS.map((r) => [r.id, r]));

export function regionById(id: RegionId): Region {
  const region = BY_ID.get(id);
  if (!region) throw new Error(`Unknown region: ${id}`);
  return region;
}

/**
 * Every country that appears in the roster must be listed here exactly once.
 * `tests/data.test.ts` fails the build if a roster entry names an unmapped
 * country, which keeps region assignment from drifting per-athlete.
 *
 * Judgement calls that are worth knowing about:
 *  - The UK is split into its football nations; all four map to `uk-ireland`.
 *  - Turkiye and the South Caucasus sit in `eastern-europe`, matching the way
 *    UEFA groups them and the way grid players tend to think about them.
 *  - The Caribbean and Central America sit in `north-america`.
 */
const COUNTRY_REGION_TABLE: Record<RegionId, readonly string[]> = {
  africa: [
    'Algeria', 'Angola', 'Benin', 'Burkina Faso', 'Cameroon', 'Cape Verde',
    'Chad', 'Comoros', 'Congo', 'DR Congo', 'Egypt', 'Equatorial Guinea',
    'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
    'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Liberia', 'Libya', 'Madagascar',
    'Mali', 'Mauritania', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'Senegal', 'Sierra Leone', 'Somalia', 'South Africa',
    'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia',
    'Zimbabwe',
  ],
  'south-america': [
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana',
    'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela',
  ],
  'north-america': [
    'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica', 'Cuba', 'Curacao',
    'Dominica', 'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala',
    'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama',
    'Puerto Rico', 'Saint Lucia', 'Trinidad and Tobago', 'United States',
    'US Virgin Islands',
  ],
  'uk-ireland': ['England', 'Ireland', 'Northern Ireland', 'Scotland', 'Wales'],
  'western-europe': [
    'Austria', 'Belgium', 'France', 'Germany', 'Liechtenstein', 'Luxembourg',
    'Monaco', 'Netherlands', 'Switzerland',
  ],
  'southern-europe': [
    'Andorra', 'Cyprus', 'Greece', 'Italy', 'Malta', 'Portugal', 'San Marino',
    'Spain',
  ],
  'eastern-europe': [
    'Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Czech Republic', 'Estonia', 'Georgia', 'Hungary',
    'Kosovo', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro',
    'North Macedonia', 'Poland', 'Romania', 'Russia', 'Serbia', 'Slovakia',
    'Slovenia', 'Turkiye', 'Ukraine',
  ],
  nordic: ['Denmark', 'Faroe Islands', 'Finland', 'Iceland', 'Norway', 'Sweden'],
  'asia-oceania': [
    'Afghanistan', 'Australia', 'Bahrain', 'Bangladesh', 'China', 'Fiji',
    'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan',
    'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Lebanon', 'Malaysia',
    'Mongolia', 'Nepal', 'New Zealand', 'North Korea', 'Oman', 'Pakistan',
    'Palestine', 'Papua New Guinea', 'Philippines', 'Qatar', 'Samoa',
    'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan',
    'Tajikistan', 'Thailand', 'Tonga', 'Turkmenistan', 'United Arab Emirates',
    'Uzbekistan', 'Vietnam',
  ],
};

export const COUNTRY_REGION: ReadonlyMap<string, RegionId> = (() => {
  const map = new Map<string, RegionId>();
  for (const [regionId, countries] of Object.entries(COUNTRY_REGION_TABLE)) {
    for (const country of countries) {
      if (map.has(country)) {
        throw new Error(`Country listed in two regions: ${country}`);
      }
      map.set(country, regionId as RegionId);
    }
  }
  return map;
})();

export function regionForCountry(country: string): RegionId {
  const region = COUNTRY_REGION.get(country);
  if (!region) {
    throw new Error(
      `Country "${country}" is not mapped to a region. Add it to COUNTRY_REGION_TABLE in src/data/regions.ts.`,
    );
  }
  return region;
}
