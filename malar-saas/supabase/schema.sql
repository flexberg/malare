-- MålarSaaS – Databasschema
-- Kör detta i Supabase SQL Editor

-- Kunder (ett kort per telefonnummer)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Samtal
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  twilio_call_sid TEXT UNIQUE NOT NULL,
  recording_url TEXT,
  transcript TEXT,
  duration_seconds INT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  called_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extraherad information per samtal
CREATE TABLE extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('address', 'measurement', 'material', 'price', 'date', 'phone', 'other')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uppgifter & påminnelser
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  detail TEXT,
  category TEXT NOT NULL CHECK (category IN ('kund', 'material', 'offert', 'ringa', 'möte', 'övrigt')),
  urgency TEXT NOT NULL CHECK (urgency IN ('nu', 'idag', 'veckan', 'ingen_brads')),
  remind_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för vanliga queries
CREATE INDEX idx_calls_customer_id ON calls(customer_id);
CREATE INDEX idx_calls_called_at ON calls(called_at DESC);
CREATE INDEX idx_extracted_data_customer_id ON extracted_data(customer_id);
CREATE INDEX idx_extracted_data_call_id ON extracted_data(call_id);
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX idx_tasks_remind_at ON tasks(remind_at) WHERE completed = FALSE;
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Trigger: uppdatera customers.updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (aktivera när autentisering läggs till)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
