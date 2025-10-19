/**
 * Setup Storage Bucket Script
 * Creates the team-assets bucket with proper policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupBucket() {
  console.log('Setting up team-assets storage bucket...\n')

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('Error listing buckets:', listError)
    return
  }

  const bucketExists = buckets?.some(b => b.name === 'team-assets')

  if (bucketExists) {
    console.log('✓ Bucket "team-assets" already exists')
  } else {
    // Create the bucket
    const { data: bucket, error: createError } = await supabase.storage.createBucket('team-assets', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    })

    if (createError) {
      console.error('✗ Error creating bucket:', createError)
      return
    }

    console.log('✓ Created bucket "team-assets"')
  }

  console.log('\nBucket setup complete!')
  console.log('You can now upload team avatars and backgrounds.')
}

setupBucket().catch(console.error)
