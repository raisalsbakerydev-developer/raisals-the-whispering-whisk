BEGIN;

-- Custom offer text is required only while a Custom Offer is enabled.
-- The application already clears offer_text when an offer is disabled; this
-- keeps the database rule aligned with that intended state model.
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_custom_offer_text_check;

ALTER TABLE products
  ADD CONSTRAINT products_custom_offer_text_check
    CHECK (
      NOT offer_enabled
      OR offer_type <> 'custom'
      OR (offer_text IS NOT NULL AND char_length(trim(offer_text)) BETWEEN 1 AND 120)
    );

COMMIT;
