// @ts-check
import { app } from "./app.js";

const PORT = 6173;

app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Express server started on port ${PORT}`);
});
