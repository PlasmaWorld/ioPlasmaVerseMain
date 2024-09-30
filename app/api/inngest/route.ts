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

const scheduledApiCall2 = ingestClient.createFunction(
  { id: "Scheduled API Nft Call" }, // Function name
  { cron: "*/60 * * * *" }, // Cron schedule: every 5 minutes
  async () => {
    // Your API call logic
    const response = await fetch("https://www.ioplasmaverse.com/api/saveNftEvents", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Add your request body if needed
    });

    const data = await response.json();
    return data; // Handle API response here
  }
);
const scheduledApiCall3 = ingestClient.createFunction(
  { id: "Scheduled API Nft2 Call" }, // Function name
  { cron: "*/66 * * * *" }, // Cron schedule: every 5 minutes
  async () => {
    // Your API call logic
    const response = await fetch("https://www.ioplasmaverse.com/api/saveNftEvents2", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Add your request body if needed
    });

    const data = await response.json();
    return data; // Handle API response here
  }
);
export const { GET, POST, PUT } = serve({
  client: ingestClient,
  functions: [scheduledApiCall,scheduledApiCall2,scheduledApiCall3], // Add other functions as needed
});
