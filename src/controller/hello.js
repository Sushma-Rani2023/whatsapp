exports.hello=async(event)=>{

    console.log(process.env.mytoken)

    return {
        statusCode: 200,
        body: JSON.stringify("Data read and saved successfully"),
      };
}