const AWS = require('aws-sdk');
      const ddb = new AWS.DynamoDB.DocumentClient();
      exports.handler = async function (event, context) {
        let connections;
         try {
           connections = await ddb.scan({ TableName: process.env.table }).promise();
        } catch (err) {
          console.log(err);
           return {
            statusCode: 500,
          };
         }
        let user_id = 0;
       const id_taken= Array(10).fill(false);
           connections.Items.map(async ({ connectionId,id }) => {
              console.log(id)
              id_taken[id]=true
          });
        for ( let i =0; i<10;i++){
          if(!id_taken[i]){
              user_id=i;
              id_taken[user_id]=true;
              break;
          }
        }
        
        try {
          await ddb
            .put({
              TableName: process.env.table,
              Item: {
                connectionId: event.requestContext.connectionId,
                id: user_id
              },
            })
            .promise();
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
        try {
            let send_message={"message":"game start"};
            if(id_taken[0]&&id_taken[1]&&id_taken[2]&&id_taken[3]){
                      const sendMessages = connections.Items.map(async ({ connectionId,id }) => {
                        await callbackAPI.postToConnection({ ConnectionId: connectionId, Data:JSON.stringify(send_message)}).promise();});
              try {
                await Promise.all(sendMessages);
              } catch (e) {
                console.log(e);
              return {
                statusCode: 500,
              };
              }
            }
        } catch (e) {
          console.log(e);
          return {
            statusCode: 500,
          };
        }
        
       
        return {
          statusCode: 200,
        };
      };