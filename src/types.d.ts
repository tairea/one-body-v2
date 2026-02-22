export type Person = Readonly<{
  id: string; // UUID
  userId: string; // auth.users UUID
  name: string;
  photoUrl?: string; // Supabase Storage public URL — path is {user_id}/avatar (no extension)
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  layer1: ReadonlyArray<string>;
  layer2: ReadonlyArray<string>;
  layer3: ReadonlyArray<string>;
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
  person1Id: string; // UUID
  person2Id: string; // UUID
  ranking: number;
  reason: string;
  potential: string[];
};

/** Supabase row shape (snake_case from DB) */
export type PersonRow = {
  id: string;
  user_id: string;
  name: string;
  location_name: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  layer1_list: string[];
  layer2_list: string[];
  layer3_list: string[];
  persons_graph_snapshot: Person["personsGraphSnapshot"] | null;
  created_at: string;
};

export type RecommendationRow = {
  person1_id: string;
  person2_id: string;
  ranking: number;
  reason: string;
  potential: string[];
};
