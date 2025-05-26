/*
  # Add insert policy for profiles table

  1. Changes
    - Add policy to allow users to insert their own profile during registration

  2. Security
    - Policy ensures users can only create their own profile
    - Profile ID must match the authenticated user's ID
*/

-- Create policy for profile insertion
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);