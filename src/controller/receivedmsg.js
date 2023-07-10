module.exports.receivedmsg = async (event) => {
    console.log("Running Postman",event);
    
    const body_param = JSON.parse(event.body);
    console.log(JSON.stringify(body_param));
  
    if (body_param.object) {
      if (
        body_param.entry &&
        body_param.entry[0].changes &&
        body_param.entry[0].changes[0].valua.messages &&
        body_param.entry[0].changes[0].valua.messages[0]
      ) {
        const phone_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body_param.entry[0].changes[0].value.messages[0].from;
        const msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
  
        // axios({
        //   method: "POST",
        //   uri: "https://graph.facebook.com/v17.0/" + phone_no_id + "/messages?access_token=" + token,
        //   data: {
        //     messaging_product: "whatsapp",
        //     to: from,
        //     text: {
        //       body: "hi ... I am Sushma"
        //     }
        //   },
        //   headers: {
        //     "Content-Type": "application/json"
        //   }
        // });
  
        return {
          statusCode: 200,
          body: "Success"
        };
      } else {
        return {
          statusCode: 404,
          body: "Not Found"
        };
      }
    }
  };
  