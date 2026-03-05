import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server ready at: http://localhost:${PORT}`);
});

export default server;
