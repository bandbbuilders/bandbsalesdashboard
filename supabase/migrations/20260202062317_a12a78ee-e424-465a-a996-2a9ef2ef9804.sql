-- Delete test/user profiles that are not referenced by sales
DELETE FROM profiles WHERE id IN (
  '2500a991-f126-41f7-8737-7441a32c1e1d', 
  '13735017-4d55-41da-b297-eb11a2493f22'
);