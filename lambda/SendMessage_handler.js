const AWS = require('aws-sdk');
      const ddb = new AWS.DynamoDB.DocumentClient();
      
      exports.handler = async function (event, context) {
        let connections;
        try {
          connections = await ddb.scan({ TableName: process.env.table }).promise();
        } catch (err) {
          return {
            statusCode: 500,
          };
        }
        const callbackAPI = new AWS.ApiGatewayManagementApi({
          apiVersion: '2018-11-29',
          endpoint:
            event.requestContext.domainName + '/' + event.requestContext.stage,
        });
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
        const message = JSON.parse(event.body).message;
        const sendMessages = connections.Items.map(async ({ connectionId,id }) => {
          let send_message= {"message": message, "id":user_id }
          if (connectionId !== event.requestContext.connectionId) {
            try {
              await callbackAPI
                .postToConnection({ ConnectionId: connectionId, Data:JSON.stringify(send_message)})
                .promise();
            } catch (e) {
              console.log(e);
            }
          }
        });
      
        try {
          await Promise.all(sendMessages);
        } catch (e) {
          console.log(e);
          return {
            statusCode: 500,
          };
        }
      
        return { statusCode: 200 };
      };