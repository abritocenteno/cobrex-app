import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 08:00 UTC — scan expiring travel documents and visas
crons.cron(
  "check-travel-alerts",
  "0 8 * * *",
  internal.travelAlerts.checkTravelAlerts,
  {}
);

export default crons;
