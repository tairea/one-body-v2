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
  personsGraphSnapshot?: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      photo?: string;
      nodeSize?: number;
      position: { x: number; y: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
    }>;
  };
}>;

export type Recommendation = {
  person1Id: number;
  person2Id: number;
  ranking: number;
  reason: string;
  potential: string[];
};
