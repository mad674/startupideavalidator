const { ExpressAdapter } =require("@bull-board/express");

const { createBullBoard } =require("@bull-board/api");

const { BullMQAdapter } =require("@bull-board/api/bullMQAdapter");

const createReportQueue =require("../queues/reportQueue");

const createBullBoardServer=()=>{
    const serverAdapter =new ExpressAdapter();

    serverAdapter.setBasePath("/admin/queues");

    const reportQueue =createReportQueue();

    createBullBoard({
        queues: [
        new BullMQAdapter(reportQueue)
        ],
        serverAdapter
    });
    return serverAdapter;
};
module.exports = createBullBoardServer;
