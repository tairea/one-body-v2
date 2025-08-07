export type Person = Readonly<{
  id: number;
  name: string;
  hasPhoto: boolean;
  email?: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  values: ReadonlyArray<string>;
  vision: ReadonlyArray<string>;
  vehicles: ReadonlyArray<string | { org: string; mission: string }>;
}>;

export type Recommendation = {
  person1Id: number;
  person2Id: number;
  ranking: number;
  reason: string;
  potential: string[];
};
