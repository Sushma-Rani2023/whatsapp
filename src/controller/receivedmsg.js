const axios = require("axios");
const { saveorder } = require("../controller/saveorder");

module.exports.receivedmsg = async (event) => {
  try {
    console.log("Let's Start");
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
      const res = await saveorder(body_param);
      console.log("response", res);
      const phonid = body_param.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body_param.entry[0].changes[0].value.messages[0].from;
      const taggedMessageId = body_param.entry[0].changes[0].value.messages[0].id;
      console.log("phonid and from", phonid, from, taggedMessageId);

      const axiosConfig = {
        method: "POST",
        url: `https://graph.facebook.com/v17.0/${phonid}/messages?access_token=${process.env.token}`,
        data: {
          messaging_product: "whatsapp",
          context: {
            message_id: taggedMessageId,
          },
          to: from,
          type: "text",
          text: {
            preview_url: false,
            body: res.body.message,
          },
        },
      };

     const reply= await axios(axiosConfig)

      // const response = await axios(axiosConfig).then((res)=>{

      //   console.log("res",res)
      //   return {
      //     statusCode: 200,
      //     body: JSON.stringify({ message: "Reply sent successfully" }),
      //   };
      // })
      // .catch((err)=>{
      //   console.log("err",err)
      //   return {
      //     statusCode: 404,
      //     body: JSON.stringify({ message: "Invalid request body" }),
      //   };

      // })
      // console.log("response from first POST API");


      console.log("reply sent successfully",reply);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Reply sent successfully" }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Invalid request body" }),
      };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
