-- Create mood_series table for storing daily market sentiment and price data
CREATE TABLE IF NOT EXISTS public.mood_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mood_score DECIMAL,
  t_pos INTEGER DEFAULT 0,
  t_neg INTEGER DEFAULT 0,
  t_neutral INTEGER DEFAULT 0,
  c_pos INTEGER DEFAULT 0,
  c_neg INTEGER DEFAULT 0,
  c_neutral INTEGER DEFAULT 0,
  close DECIMAL,
  ema20 DECIMAL,
  ema50 DECIMAL,
  norm_ema20 DECIMAL,
  norm_ema50 DECIMAL,
  norm_close DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_mood_series_date ON public.mood_series(date DESC);

-- Enable RLS (but allow public read access for market data)
ALTER TABLE public.mood_series ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read market sentiment data
CREATE POLICY "Allow public read access to mood_series"
  ON public.mood_series
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (for admin purposes)
CREATE POLICY "Allow authenticated insert to mood_series"
  ON public.mood_series
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to mood_series"
  ON public.mood_series
  FOR UPDATE
  USING (auth.role() = 'authenticated');