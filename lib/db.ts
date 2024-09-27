// lib/db.ts

import { createPool } from '@vercel/postgres';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

// Create a pool using the connection string from the environment variable
const pool = createPool({
  connectionString: process.env.DATABASE_URL || "postgres://default:gKku8p1HQFby@ep-long-cake-a24s8403-pooler.eu-central-1.aws.neon.tech/verceldb?sslmode=require", // This uses the DATABASE_URL from your environment variables
});

// Function to create the 'contracts' table if it doesn't exist
export async function createContractsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
      deployerAddress TEXT NOT NULL,
      contractAddress TEXT NOT NULL,
      chain TEXT NOT NULL,
      chainId INT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      thumbnailUrl TEXT,
      explorer TEXT,
      type TEXT NOT NULL,
      typeBase TEXT NOT NULL,
      social_urls JSONB,
      createdAt TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
}

export async function createMarketplaceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketplace (
      id SERIAL PRIMARY KEY,
      deployerAddress TEXT NOT NULL,
      contractAddress TEXT NOT NULL,
      chain TEXT NOT NULL,
      chainId INT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      thumbnailUrl TEXT,
      explorer TEXT,
      type TEXT NOT NULL,
      currencyContractAddress TEXT NOT NULL,
      social_urls JSONB,
      createdAt TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
}

export async function createMarketplaceNftContractsTable(tableName: string) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      deployerAddress TEXT NOT NULL,
      contractAddress TEXT NOT NULL,
      chain TEXT NOT NULL,
      chainId INT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      thumbnailUrl TEXT,
      explorer TEXT,
      type TEXT NOT NULL,
      typeBase TEXT NOT NULL,
      social_urls JSONB,
      createdAt TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
}


export async function createContractStatsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contract_total_supply (
      id SERIAL PRIMARY KEY,
      chain_id INT NOT NULL,  -- Changed from chainId to chain_id
      contract_address TEXT NOT NULL UNIQUE,
      total_supply INT NOT NULL,
      valid_total_supply INT NOT NULL,
      unique_owners INT NOT NULL,
      last_updated TIMESTAMP DEFAULT NOW()
    );
  `);
}



// lib/db.ts

export async function createInvoiceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice (
      id SERIAL PRIMARY KEY,
      deployerAddress TEXT NOT NULL UNIQUE
    );
  `);
}

export async function createLatestBlockHeightTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS latest_block_height (
      id SERIAL PRIMARY KEY,
      contract_address TEXT UNIQUE,  -- The address of the contract
      latest_block_height BIGINT,    -- The last block height that was processed
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp of the last update
    );
  `);
}

export async function createEventShibaPunksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_shiba_punks_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price, -- The Price the Nft was sold,
      marketplace -- The Marketplace where the Item was sold 
    );
  `);
}


export async function createEventBuzzBotsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_buzz_bots_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventLoxodromeTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_loxodrome_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
  marketplace TEXT  
    );
  `);
}

export async function createEventMachinFiTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_machinfi_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventMimoAlbieTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_mimo_albie_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventMimoBimbyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_mimo_bimby_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventMimoGizyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_mimo_gizy_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventMimoPippiTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_mimo_pippi_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventMimoSpaceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_mimo_space_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventPunksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_punks_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventRobotAiTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_robotai_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventWebstreamTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_webstream_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventSumoTexTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_sumotex_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
       price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}

export async function createEventXSumoTexTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_xsumotex_events (
      id SERIAL PRIMARY KEY,
      contract_address TEXT,        -- The address of the contract
      from_address TEXT,            -- The address sending the token
      to_address TEXT,              -- The address receiving the token
      token_id TEXT,                -- The ID of the token transferred
      chain_id INTEGER,             -- The chain ID of the transaction
      block_number BIGINT,          -- The block number where the event was recorded
      transaction_hash TEXT,        -- The transaction hash for the event
      event_name TEXT,              -- The name of the event, e.g., "Transfer"
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the event was fetched
      price NUMERIC,                -- The price the NFT was sold for
      marketplace TEXT  
    );
  `);
}
function sanitizeTableName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase(); // Sanitize table names
}



// Export the pool to use in other parts of the application
export { pool };
