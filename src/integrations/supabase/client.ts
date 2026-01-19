import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://krxfkcdnrsywwofefqpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);