// @ts-check
import express from "express";
import cors from "cors";
import { addPerson, readPeople } from "./database/database.js";
import { recommendations } from "./hard-coded/recommendations.js";
import { Buffer } from "node:buffer";
import * as crypto from "node:crypto";

// TODO: This should be moved to an environment variable.
const SIGNUP_SECRET = Buffer.from("b212a1df912ed2f6", "hex");

/**
 * @param {unknown} rawGuess
 * @returns {boolean}
 */
const isSignupSecretGuessValid = (rawGuess) => {
  if (typeof rawGuess !== "string") return false;
  // This sanity check ensures that the guess is even worth converting to a
  // buffer. This helps avoid wasting time converting extremely long guesses.
  if (rawGuess.length !== SIGNUP_SECRET.byteLength * 2) return false;
  const guess = Buffer.from(rawGuess, "hex");
  return (
    guess.byteLength === SIGNUP_SECRET.byteLength &&
    crypto.timingSafeEqual(guess, SIGNUP_SECRET)
  );
};

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

app.post("/validate_secret", (req, res) => {
  const isValid = isSignupSecretGuessValid(req.body.secret);
  res.status(isValid ? 204 : 401).end();
});

app.post("/addperson", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).end();
    return;
  }

  const { secret, personData } = req.body;

  if (!isSignupSecretGuessValid(secret)) {
    res.status(401).end();
    return;
  }

  // TODO: This is unsafe
  addPerson(personData);

  res.json({ TODO: true });
});

export { app };
