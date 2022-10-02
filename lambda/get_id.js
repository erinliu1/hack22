const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
        const callbackAPI = new AWS.ApiGatewayManagementApi({
          apiVersion: '2018-11-29',
          endpoint:
            event.requestContext.domainName + '/' + event.requestContext.stage,
        });
        let connections;
         try {
           connections = await ddb.scan({ TableName: process.env.table }).promise();
        } catch (err) {
          console.log(err);
           return {
            statusCode: 500,
          };
         }
         let user_id;
        connections.Items.map(async ({ connectionId,id }) => {
          if (connectionId == event.requestContext.connectionId) {
            try {
              user_id=id;
            } catch (e) {
              console.log(e);
            }
          }
        });
        
        let send_message= {"id":user_id }
        try {
          await callbackAPI.postToConnection({ ConnectionId: event.requestContext.connectionId, Data:JSON.stringify(send_message)}).promise();
        } catch (e) {
          console.log(e);
          return {
            statusCode: 500,
          };
        }
      
        return { statusCode: 200 };
};
