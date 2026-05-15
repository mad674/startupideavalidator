const { Worker } = require("bullmq");

const fs = require("fs");
const path = require("path");

const { getRedisClient } = require("../config/redis");
const Report = require("../models/Report");
const logger = require("../config/logger");

const worker = new Worker(
"pdf-report-queue",
async (job) => {
    logger.info(`🚀 Processing Job ${job.id}`);

    const { idea_id, user_id } = job.data;
    // Call FastAPI PDF Service
    const response = await fetch(
    `${process.env.FASTAPI_URL}/api/pdf`,
    {
        method: "POST",

        headers: {
        "Content-Type": "application/json",
        },

        body: JSON.stringify({
        idea_id,
        user_id
        }),
    }
    );
    // console.log("response",response);
    if (!response.ok) {
    throw new Error("Failed to generate PDF");
    }
    const contentDisposition =response.headers.get("content-disposition");
    let originalFileName = "report.pdf";
    if (contentDisposition) {
        const utf8Match =contentDisposition.split("filename*=utf-8''");
        // console.log("utf8Match",utf8Match);
        // console.log(contentDisposition);
        if (utf8Match && utf8Match[1]) {
            originalFileName =decodeURIComponent(utf8Match[1]);
        } else {
        // Fallback normal filename=""
            const normalMatch =contentDisposition.match(
                /filename="?(.+?)"?$/
            );

            if (normalMatch && normalMatch[1]) {
                originalFileName = normalMatch[1];
            }
        }
    }
    
    // console.log(`✅ PDF generated: ${originalFileName}`);
    // console.log(response);
    const timestamp = Date.now();

    const extension =path.extname(originalFileName);

    const baseName =path.basename(originalFileName, extension);

    const storedFileName =`${baseName}-${timestamp}${extension}`;


    // Convert PDF stream to buffer
    const arrayBuffer = await response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // Create reports directory
    const reportsDir = path.join(__dirname, "../../reports");

    if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
    }
    // Save PDF file
    const filePath = path.join(reportsDir, storedFileName);

    fs.writeFileSync(filePath, buffer);
    await Report.create({idea_id,user_id,file_name: storedFileName,status: "completed"});
    // console.log(`✅ PDF saved: ${storedFileName}`);
    logger.info(`✅ PDF saved: ${storedFileName}`);
    // Return downloadable URL
    return {
    success: true,
    storedFileName: storedFileName,
    originalFileName: originalFileName
    };

},
    {
        connection: getRedisClient(),
        concurrency: 5
    }
);

worker.on("completed", (job) => {
console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
console.log(`❌ Job ${job.id} failed`);
console.log(err.message);
});
