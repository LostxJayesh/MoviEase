// Supabase Configuration
const SUPABASE_URL = 'https://beotqgninhaouzgpeodp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlb3RxZ25pbmhhb3V6Z3Blb2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NjU0MDIsImV4cCI6MjA1MjM0MTQwMn0.OwrhEakkYsyvDdlJomvLWfbJsPXKuqDFR83kgSkSxlk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
