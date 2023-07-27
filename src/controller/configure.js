module.exports.configure = async (event) => {
  try {
    const req = event;
    console.log("Running webhook", req, req?.query, req?.queryStringParameters);

    const mode = req?.queryStringParameters?.["hub.mode"];
    const challenge = req?.queryStringParameters?.["hub.challenge"];
    const token = req?.queryStringParameters?.["hub.verify_token"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.mytoken) {
        console.log("Verification successful");
        return {
          statusCode: 200,
          body: challenge,
        };
      } else {
        console.log("Verification failed");
        return {
          statusCode: 403,
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "hello" }),
    };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
