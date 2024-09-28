// inngest/client.ts
import { Inngest } from "inngest";
const clientId = process.env.INNGEST_CLIENT_ID;
if (!clientId) {
    throw new Error("Client ID not set");
  }
// Create an Inngest client with a unique ID
export const ingestClient = new Inngest({ id: clientId }); // Replace with a unique ID for your app
