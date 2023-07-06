SELECT reservations.id AS id, title, cost_per_night, start_date, AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
JOIN users ON reservations.guest_id = users.id
WHERE users.id = 2
GROUP BY reservations.id, title, cost_per_night, start_date
ORDER BY start_date ASC
LIMIT 10;
