export type Person = Readonly<{
  id: number;
  name: string;
  hasPhoto: boolean;
  email?: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  values: ReadonlyArray<string>;
  visions: ReadonlyArray<string>;
  vehicles: ReadonlyArray<{ title: string; description?: string }>;
}>;

export type Recommendation = {
  person1Id: number;
  person2Id: number;
  ranking: number;
  reason: string;
  potential: string[];
};
