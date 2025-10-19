/**
 * Migration Runner Script
 * Runs SQL migrations against Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile: string) {
  console.log(`Running migration: ${migrationFile}`)

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // If exec_sql doesn't exist, try running directly
      console.log('Note: exec_sql RPC not available, migration needs to be run manually via Supabase Dashboard')
      console.log('\nSQL to run:')
      console.log('=' .repeat(80))
      console.log(sql)
      console.log('=' .repeat(80))
      console.log('\nPlease run this SQL in your Supabase SQL Editor:')
      console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`)
      return
    }

    console.log('Migration completed successfully!')
    console.log('Data:', data)
  } catch (error) {
    console.error('Error running migration:', error)

    // Still output the SQL for manual execution
    console.log('\nSQL to run manually:')
    console.log('=' .repeat(80))
    console.log(sql)
    console.log('=' .repeat(80))
  }
}

// Run the team customization migration
runMigration('add_team_customization.sql')
