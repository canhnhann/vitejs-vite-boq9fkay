import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://xwylvcnjcidlisarowxa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWx2Y25qY2lkbGlzYXJvd3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTMzMzAsImV4cCI6MjA5NTI2OTMzMH0.O-RTlMDYXu2JeD6T-EzoGL-dLVRwSROo3VtNkyg_7T4'
);
