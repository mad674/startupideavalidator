const { Queue } = require("bullmq");

const { getRedisClient } = require("../config/redis");

const createReportQueue = () => {

  return new Queue(
    "pdf-report-queue",
    {
    connection: getRedisClient()
    }
  );
};

module.exports = createReportQueue;
