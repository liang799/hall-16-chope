-- Seed Hall 16 Rooms
-- Block 16A floors 1-3, rooms 01-03 with S suffix

INSERT INTO public.rooms (room_number, block, floor) VALUES
  -- Block 16A, Floor 1
  ('16A-01-01S', '16A', 1),
  ('16A-01-02S', '16A', 1),
  ('16A-01-03S', '16A', 1),
  -- Block 16A, Floor 2
  ('16A-02-01S', '16A', 2),
  ('16A-02-02S', '16A', 2),
  ('16A-02-03S', '16A', 2),
  -- Block 16A, Floor 3
  ('16A-03-01S', '16A', 3),
  ('16A-03-02S', '16A', 3),
  ('16A-03-03S', '16A', 3),
  -- Block 16B, Floor 1
  ('16B-01-01S', '16B', 1),
  ('16B-01-02S', '16B', 1),
  ('16B-01-03S', '16B', 1),
  -- Block 16B, Floor 2
  ('16B-02-01S', '16B', 2),
  ('16B-02-02S', '16B', 2),
  ('16B-02-03S', '16B', 2),
  -- Block 16B, Floor 3
  ('16B-03-01S', '16B', 3),
  ('16B-03-02S', '16B', 3),
  ('16B-03-03S', '16B', 3),
  -- Block 16C, Floor 1
  ('16C-01-01S', '16C', 1),
  ('16C-01-02S', '16C', 1),
  ('16C-01-03S', '16C', 1),
  -- Block 16C, Floor 2
  ('16C-02-01S', '16C', 2),
  ('16C-02-02S', '16C', 2),
  ('16C-02-03S', '16C', 3),
  -- Block 16C, Floor 3
  ('16C-03-01S', '16C', 3),
  ('16C-03-02S', '16C', 3),
  ('16C-03-03S', '16C', 3)
ON CONFLICT (room_number) DO NOTHING;
