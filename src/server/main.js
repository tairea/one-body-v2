// @ts-check
import { app } from "./app.js";

const port = parseInt(process.env.PORT, 10) || 6173;

app.listen(port, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Express server started on port ${port}`);
});
