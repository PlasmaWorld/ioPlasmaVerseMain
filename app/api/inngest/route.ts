// app/api/inngest/route.ts
import { ingestClient } from "@/inngest/ingestClient";
import { serve } from "inngest/next";
const scheduledApiCall = ingestClient.createFunction(
  { id: "Scheduled API Call" }, // Function name
  { cron: "*/3 * * * *" }, // Cron schedule: every 5 minutes
  async () => {
    // Your API call logic
    const response = await fetch("https://www.ioplasmaverse.com/api/saveMarkeplaceContracts", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Add your request body if needed
    });

    const data = await response.json();
    return data; // Handle API response here
  }
);
// This will serve the scheduled API call
export const { GET, POST, PUT } = serve({
  client: ingestClient,
  functions: [scheduledApiCall], // Add other functions as needed
});
