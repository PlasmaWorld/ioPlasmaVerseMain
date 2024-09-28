// inngest/functions.ts
import { ingestClient } from "./ingestClient";

// Example: Scheduled function to run every 5 minutes
export const scheduledApiCall = ingestClient.createFunction(
  { id: "Scheduled API Call" }, // Function name
  { cron: "*/5 * * * *" }, // Cron schedule: every 5 minutes
  async () => {
    // Your API call logic
    const response = await fetch("https://www.ioplasmaverse.com/api/inngest", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Add your request body if needed
    });

    const data = await response.json();
    return data; // Handle API response here
  }
);
