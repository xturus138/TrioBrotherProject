-- Create users table for the three BestTrio members
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table for photos/videos
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  blob_url TEXT NOT NULL,
  caption TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  hearts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hearts table to track who hearted what
CREATE TABLE IF NOT EXISTS asset_hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(asset_id, user_id)
);

-- Create shares table for public sharing
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (id = auth.uid());

-- RLS Policies for folders table
CREATE POLICY "Users can view all folders" ON folders FOR SELECT USING (true);
CREATE POLICY "Users can create folders" ON folders FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own folders" ON folders FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own folders" ON folders FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for assets table
CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Users can create assets" ON assets FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can update their own assets" ON assets FOR UPDATE USING (uploaded_by = auth.uid());
CREATE POLICY "Users can delete their own assets" ON assets FOR DELETE USING (uploaded_by = auth.uid());

-- RLS Policies for asset_hearts table
CREATE POLICY "Users can view all hearts" ON asset_hearts FOR SELECT USING (true);
CREATE POLICY "Users can create hearts" ON asset_hearts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own hearts" ON asset_hearts FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for shares table
CREATE POLICY "Users can view all shares" ON shares FOR SELECT USING (true);
CREATE POLICY "Users can create shares" ON shares FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can delete their own shares" ON shares FOR DELETE USING (created_by = auth.uid());
