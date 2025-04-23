// Load environment variables in local development
require('dotenv').config();

module.exports = (req, res) => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Mapbox token is not set' });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ token });
};