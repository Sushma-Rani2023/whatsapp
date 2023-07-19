const { saveorder } = require("../controller/saveorder");

exports.receivedmsg = async (event) => {
  try {
    console.log("Let's Start");
    return {
      statusCode:200
    }
    console.log("Hi", event.body);

    const body_param = JSON.parse(event.body);
    console.log("body_param", body_param);
    if (
      body_param.object &&
      body_param.entry &&
      body_param.entry[0].changes &&
      body_param.entry[0].changes[0].value.messages &&
      body_param.entry[0].changes[0].value.messages[0]
    ) {
      await saveorder(body_param);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Order is saved successfully" }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Invalid request body" }),
      };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
