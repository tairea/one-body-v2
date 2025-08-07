export type Person = Readonly<{
  id: number;
  name: string;
  photo?: Buffer;
  email?: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  values: ReadonlyArray<string>;
  vision: ReadonlyArray<string>;
  vehicles: ReadonlyArray<string | { org: string; mission: string }>;
}>;
