const fetch = require("node-fetch");

const checkAIService = async (
  req,
  res,
  next
) => {

  try {

    const response = await fetch(
      `${process.env.FASTAPI_URL}/health`
    );

    // AI DOWN
    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message:
          "AI service temporarily unavailable",
      });
    }

    // AI ONLINE
    next();

  } catch (err) {

    console.error("AI Service Error:", err);

    return res.status(503).json({
      success: false,
      message:
        "AI service temporarily unavailable",
    });
  }
};

module.exports = checkAIService;