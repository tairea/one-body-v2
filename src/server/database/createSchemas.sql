PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY,
    secretKey TEXT NOT NULL,
    name TEXT NOT NULL,
    -- TODO: Consider photo path
    photo BLOB,
    email TEXT UNIQUE,
    locationName TEXT,
    -- TODO: Consider geocoding strategy
    locationLatitude REAL,
    locationLongitude REAL,
    -- TODO: Consider something more robust
    valuesList BLOB NOT NULL,
    visionsList BLOB NOT NULL,
    vehiclesList BLOB NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS recommendations (
    person1Id INTEGER NOT NULL,
    person2Id INTEGER NOT NULL,
    ranking REAL NOT NULL,
    reason TEXT NOT NULL,
    potential BLOB NOT NULL,
    PRIMARY KEY (person1Id, person2Id),
    FOREIGN KEY (person1Id) REFERENCES people(id) ON DELETE CASCADE,
    FOREIGN KEY (person2Id) REFERENCES people(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS groupMemberships (
    groupId INTEGER NOT NULL,
    personId INTEGER NOT NULL,
    PRIMARY KEY (groupId, personId),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) STRICT;