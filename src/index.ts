import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);


const app: Express = express();
const port = process.env.PORT || 3001;


app.get("/", (req: Request, res: Response) => {
  const ip = req.ip;
  res.send(`Hello, ${ip}`);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});