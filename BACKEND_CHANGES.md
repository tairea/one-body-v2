# Backend Changes for personsGraphSnapshot Feature

## Overview

Added support for storing and retrieving custom graph node positions for each person's interactive graph visualization.

## Database Changes

### 1. Schema Update

- **File**: `src/server/database/createSchemas.sql`
- **Change**: Added `personsGraphSnapshot BLOB` column to `people` table
- **Purpose**: Store JSON-serialized graph layout data

### 2. Migration Script

- **File**: `src/server/database/migrate.js`
- **Command**: `npm run database:migrate`
- **Purpose**: Safely add the new column to existing databases

## Code Changes

### 1. Database Functions (`src/server/database/database.js`)

#### `addPerson(person)`

- Now accepts and stores `personsGraphSnapshot` field
- Converts JSON to BLOB for storage

#### `updatePerson(person, secretKey)`

- Now updates `personsGraphSnapshot` field
- Preserves existing snapshot data when updating other fields

#### `readPeople()`

- Now returns `personsGraphSnapshot` field
- Converts BLOB back to JSON for frontend consumption

### 2. Data Structure

The `personsGraphSnapshot` contains:

```json
{
  "nodes": [
    {
      "id": "value-0",
      "label": "family",
      "type": "value",
      "position": { "x": 200.5, "y": -67.2 }
    }
  ],
  "edges": [
    {
      "id": "person-value-0",
      "source": "person",
      "target": "value-0",
      "label": "has value"
    }
  ]
}
```

## API Impact

### Backward Compatibility

- ✅ **Non-breaking change**: Existing API consumers continue to work
- ✅ **Optional field**: `personsGraphSnapshot` is optional and defaults to `undefined`
- ✅ **Existing data**: All existing person records remain valid

### Response Changes

```json
{
  "id": 123,
  "name": "John Doe",
  "values": ["family", "health"],
  "personsGraphSnapshot": {
    /* graph data or undefined */
  }
}
```

## Deployment Steps

1. **Run Migration**: `npm run database:migrate`
2. **Restart Server**: The new field will be automatically handled
3. **Verify**: Check that existing data loads correctly

## Testing

### Frontend Testing

- Drag nodes and save positions
- Verify positions persist on page reload
- Verify positions persist when updating profile

### Backend Testing

- Check that new field is stored in database
- Verify JSON serialization/deserialization works
- Confirm existing records load without errors

## Notes

- **Storage**: Each snapshot is typically 1-5KB depending on node count
- **Performance**: Minimal impact on existing queries
- **Validation**: Frontend handles missing snapshot gracefully
- **Updates**: Field is updated every time user saves new positions
