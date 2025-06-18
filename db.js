// import pg from "pg";
// import dotenv from "dotenv";
// dotenv.config();

// const pgclient = new pg.Client(process.env.DATABASE_URL);
// pgclient.connect()
//   .then(() => {
//     console.log("Connected to the database successfully");
//   })
//   .catch((err) => {
//     console.error("Error connecting to the database:", err);
//   });
// export default pgclient;
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
