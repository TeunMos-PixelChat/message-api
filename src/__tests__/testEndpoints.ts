import supertest from "supertest"; // supertest is a framework that allows to easily test web APIs
import { ArrayOrObject, QueryOptions } from "cassandra-driver";
import { DirectChatMessage } from "../typings/cassandraModels";
import { randomUUID } from "crypto";
import { app, server } from "../index";

// it("Testing to see if Jest works", () => {
//   expect(2).toBe(2);
// });

// Mock the "cassandra-driver" package
jest.mock("cassandra-driver", () => ({
  Client: jest.fn().mockImplementation(() => ({
    execute: (query: string, params?: ArrayOrObject | undefined, options?: QueryOptions | undefined) => {
      return {
        rows: [
          { id: randomUUID(), sender_id: "1", receiver_id: "2", message: "Hello, world!", created_at: new Date() },
          { id: randomUUID(), sender_id: "2", receiver_id: "1", message: "Hello, world!", created_at: new Date() },
        ],
      };
    },
  })),
}));

jest.mock("amqplib", () => ({
  connect: jest.fn().mockImplementation(() => ({
    createChannel: jest.fn().mockImplementation(() => ({
      assertQueue: jest.fn().mockImplementation(() => ({
        sendToQueue: jest.fn(),
      })),
      consume: jest.fn(),
      ack: jest.fn(),
    })),
  })),
}));



it("Root Endpoint /test", async () => {
  const response = await supertest(app).get("/");
  expect(response.text).toContain("Hello, world!");
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