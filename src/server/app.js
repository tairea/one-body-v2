import express from "express";
import cors from "cors";
import { addPerson, readPeople } from "./database/database.js";
import { recommendations } from "./hard-coded/recommendations.js";

const app = express();

app.use(express.json());

app.use(cors());

app.get("/graph", (req, res) => {
  res.json({
    people: readPeople().map((person) => ({
      ...person,
      photo: person.photo?.toString("base64"),
    })),
    // TODO: use real recommendations
    recommendations,
  });
});

app.post("/addperson", (req, res) => {
  // TODO: This is unsafe
  addPerson(req.body);
  res.json({ TODO: true });
});

export { app };
