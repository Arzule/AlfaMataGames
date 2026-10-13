// Punto de arranque del servidor.
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`AlfaMataGames API escuchando en el puerto ${PORT}`);
});
