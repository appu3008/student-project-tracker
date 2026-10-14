const { startServer } = require('./app');

const port = Number(process.env.PORT || 3000);
startServer(port);
