import express from "express"
import cors from "cors"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { people } from "./hard-coded/people.js"
import { recommendations } from "./hard-coded/recommendations.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())

const profilePhotosDir = path.join(__dirname, "hard-coded", "profile-photos")
app.use("/profile-photos", express.static(profilePhotosDir))

app.get("/graph", (req, res) => {
  res.json({ people, recommendations })
})

export { app }