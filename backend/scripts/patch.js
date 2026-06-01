import "dotenv/config";
import { applyPatchOnly } from "./migrate.js";

applyPatchOnly()
  .then(() => {
    console.log("Schema patch applied (screenshot_link column).");
  })
  .catch((err) => {
    console.error(err.message.includes("Could not apply") ? err.message : `Patch failed: ${err.message}`);
    process.exit(1);
  });
