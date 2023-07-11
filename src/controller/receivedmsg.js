const Message=require("../model/Msg")
const Item =require("../model/Product")
module.exports.receivedmsg = async (event) => {

    const body_param = JSON.parse(event.body);
    console.log(JSON.stringify(body_param));
  
    if (body_param.object) {
      if (
        body_param.entry &&
        body_param.entry[0].changes &&
        body_param.entry[0].changes[0].value.messages &&
        body_param.entry[0].changes[0].value.messages[0]
      ) {

        const msg=body_param.entry[0].changes[0].value.messages[0].text.body
        const msg_array=msg.split("\n")
        console.log('msg   ARRRRRRRR',msg_array)
      
    }
    else {
        return {
          statusCode: 404,
          body: "message Not Found"
        };
      }
  }};
  


