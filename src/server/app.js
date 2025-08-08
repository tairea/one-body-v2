// @ts-check
import cors from "cors";
import express from "express";
import { Buffer } from "node:buffer";
import * as crypto from "node:crypto";
import { sniffImageContentType } from "../lib/sniffImageContentType.js";
import {
  addPerson,
  readPeople,
  readPhotoBytes,
  readRecommendations,
} from "./database/database.js";

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
    people: readPeople(),
    recommendations: readRecommendations(),
  });
});

app.get("/photos/:personId", (req, res) => {
  const personId = Number(req.params.personId);
  if (!Number.isSafeInteger(personId)) {
    res.status(404).end();
    return;
  }

  const photoBytes = readPhotoBytes(personId);
  if (!photoBytes) {
    res.status(404).end();
    return;
  }

  const contentType = sniffImageContentType(photoBytes);
  if (!contentType) {
    res.status(404).end();
    return;
  }

  res.type(contentType);
  res.setHeader("Cache-Control", "public, max-age=600");
  res.send(photoBytes);
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
