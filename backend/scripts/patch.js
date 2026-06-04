import "dotenv/config";
import { backfillJobLinkNormalized } from "../db/applications.js";
import { applyJobLinkUniqueIndex, applyPatchOnly } from "./migrate.js";

applyPatchOnly()
  .then(async () => {
    const result = await backfillJobLinkNormalized();
    if (!result.skipped) {
      try {
        await applyJobLinkUniqueIndex();
      } catch (indexErr) {
        const msg = indexErr.message || "";
        if (msg.includes("23505") || msg.includes("duplicated")) {
          console.warn(
            "Warning: could not create unique index — duplicate job links exist for the same customer."
          );
          console.warn(
            "Remove or merge duplicates in Supabase, then run npm run db:patch again."
          );
        } else {
          throw indexErr;
        }
      }
    }
    if (result.skipped) {
      console.log("Schema patch applied.");
      return;
    }
    console.log(
      `Schema patch applied (job_link_normalized backfilled: ${result.updated} row(s)).`
    );
  })
  .catch((err) => {
    console.error(err.message.includes("Could not apply") ? err.message : `Patch failed: ${err.message}`);
    process.exit(1);
  });
