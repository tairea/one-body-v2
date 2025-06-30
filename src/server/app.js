import express from "express";
import cors from "cors";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { addPerson, readPeople } from "./database/database.js";
import { recommendations } from "./hard-coded/recommendations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(cors());

const profilePhotosDir = path.join(__dirname, "hard-coded", "profile-photos");
app.use("/profile-photos", express.static(profilePhotosDir));

app.get("/graph", (req, res) => {
  res.json({ people: readPeople(), recommendations });
});

app.post("/addperson", (req, res) => {
  // TODO: This is unsafe
  addPerson(req.body);
  res.json({ TODO: true });
});

export { app };
