process.env.RABBITMQ_HOST = "localhost";
process.env.RABBITMQ_USER = "user";
process.env.RABBITMQ_PASS = "pass";

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
  };