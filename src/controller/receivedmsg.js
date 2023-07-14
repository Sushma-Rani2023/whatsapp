const { saveorder } = require("../controller/saveorder");
exports.receivedmsg = async (event) => {
  try {
    console.log("Let's Start");
    console.log("Hi", event.body);
    const body_param = JSON.parse(event.body);
    console.log("Received Message:", JSON.stringify(body_param));

    if (
      body_param.object &&
      body_param.entry &&
      body_param.entry[0].changes &&
      body_param.entry[0].changes[0].value.messages &&
      body_param.entry[0].changes[0].value.messages[0]
    ) {

      console.log("Message bosy is found", body_param.entry[0].changes[0].value.messages[0])
      await saveorder(body_param).then((result) => {
        console.log('result is',result)
        
      }).catch((err) => {
        console.log('errir is',err)
        
      });

      
       return{
        statusCode:200,
        body:"Message found"
       }

    } else {
      return {
        statusCode: 404,
        body: "Message Not Found",
      };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
