import supertest from "supertest"; // supertest is a framework that allows to easily test web APIs
import { app, server } from "../index";

// it("Testing to see if Jest works", () => {
//   expect(2).toBe(2);
// });


it("Root Endpoint /test", async () => {
  const response = await supertest(app).get("/");
  expect(response.text).toBe("Hello, world! Development");
});


it("Test Endpoint /test (with user)", async () => {
  const response = await supertest(app).post("/test").send({ message: "Hello, world!" }).set("x-user-id", "user123");
  expect(response.body).toStrictEqual({
    message: "Hello, world!",
    echo: { message: "Hello, world!" },
    meta: "This is a test endpoint. bloep blap bloop.\nYou are authorized.",
    userId: "user123",
  });
});

it("Test Endpoint test (without user)", async () => {
  const response = await supertest(app).post("/test").send({ message: "Hello, world!" });
  expect(response.body).toStrictEqual({ message: "Unauthorized" });
});

afterAll(done => {
  server.close(done);
});