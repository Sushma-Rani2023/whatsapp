module.exports.configure = async (event) => {
  const req = event;
  console.log("Running webhook", req, req?.query, req?.queryStringParameters);
  let mode = req?.queryStringParameters?.["hub.mode"];
  let challenge = req?.queryStringParameters?.["hub.challenge"];
  let token = req?.queryStringParameters?.["hub.verify_token"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.mytoken) {
      console.log("if is working", challenge);
      return JSON.stringify({
        statusCode: 200,
        body: challenge,
      });
    } else {
      return JSON.stringify({
        statusCode: 403,
      });
    }
  }
  return JSON.stringify({
    statusCode: 200,
    body: { message: "hello" },
  });
};
