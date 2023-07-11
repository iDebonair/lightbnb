const { Pool } = require('pg');
const properties = require("./json/properties.json");
const users = require("./json/users.json");


const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const query = `
    SELECT * 
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  const values = [email];

  return pool
    .query(query, values)
    .then((result) => {
      const user = result.rows[0];
      return user || null;
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
      throw error;
    });
};


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const query = `
    SELECT *
    FROM users
    WHERE id = $1
  `;
  const values = [id];

  return pool
    .query(query, values)
    .then((result) => {
      const user = result.rows[0];
      return user || null;
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
      throw error;
    });
};



/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const query = `
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const values = [user.name, user.email, user.password];

  return pool
    .query(query, values)
    .then((result) => {
      const addedUser = result.rows[0];
      return addedUser;
    })
    .catch((error) => {
      console.error('Error adding user:', error);
      throw error;
    });
};


/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
query = `
SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, avg(rating) as average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = $1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT $2;
`
const values = [guest_id, limit];

return pool
.query(query, values)
.then((result) => {
  const reservations = result.rows[0];
  return reservations;
})
.catch((error) => {
  console.error('Error retrieving user:', error);
  throw error;
});
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `${queryParams.length === 1 ? 'WHERE' : 'AND'} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.push(options.maximum_price_per_night);
    queryString += `${queryParams.length === 2 ? 'WHERE' : 'AND'} cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `${queryParams.length === 1 ? 'HAVING' : 'AND'} avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  
  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  console.log('Query:', queryString);
  console.log('Params:', queryParams);

  return pool.query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((error) => {
      console.error('Error retrieving properties:', error);
      throw error;
    });
};


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const query = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
`;
const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];

return pool
  .query(query, values)
  .then((result) => {
    const newProperty = result.rows[0];
    return newProperty;
  })
  .catch((error) => {
    console.error('Error adding new property:', error);
    throw error;
  });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
