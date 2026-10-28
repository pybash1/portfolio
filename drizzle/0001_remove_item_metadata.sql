-- Remove metadata that is no longer part of an inspiration item.
UPDATE inspo.items
SET item = item - 'creator' - 'note' - 'tags'
WHERE item ?| ARRAY['creator', 'note', 'tags'];
