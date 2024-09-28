import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

// Handle the POST request
export async function POST() {
  try {
    // Run your table deletion queries here
    await pool.query(`DROP TABLE IF EXISTS "api_contract_events_4689_0xe1bb99ed442ce6c6ad3806c3afcbd8f77338"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0xaa5314f9ee6a6711e5284508fec7f40e85969ed"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0x0689021f9065b18c710f5204e41b3d20c3b7d36"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0x8cfe8baee219514be529407207fce9c612e705f"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0x778e131aa8260c1ff78007cade5e64820744f32"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0x7f8cb1d827f26434da652b4e9bd02c698cc2842"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_events_4689_0xaf1b5063a152550aebc8d6cb0da6936288eab3d"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_contract_eventsx_4689_0xc52121470851d0cba233c963fcbb2"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_contract_eventsxx_4689_0xc52121470851d0cba233c963fcbb"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_eventsxxx_4689_0xc52121470851d0cba233c963fcbb23f753eb"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_eventsxxxx_4689_0xc52121470851d0cba233c963fcbb23f753e"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_eventsxxxxxx_4689_0xc52121470851d0cba233c963fcbb23f75"`);
    await pool.query(`DROP TABLE IF EXISTS "api_route_,contract_events_4689_0x8aa9271665e480f0866d2f61fc436"`);
   
    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting tables:', error);
    return NextResponse.json(
      { error: 'Failed to delete tables', details: (error as Error).message },
      { status: 500 }
    );
  }
}
