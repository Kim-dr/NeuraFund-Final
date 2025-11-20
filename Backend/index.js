const httpServer = require('./server'); // Import from your modified server.js
require('dotenv').config();

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});