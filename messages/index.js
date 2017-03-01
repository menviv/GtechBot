/*-----------------------------------------------------------------------------
This template gets you started with a simple dialog that echoes back what the user said.
To learn more please visit
https://docs.botframework.com/en-us/node/builder/overview/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');
var moment = require('moment');
var fs = require('fs');
var DateFormat = "DD-MM-YYYY HH:mm:ss";
var LogTimeStame = moment().format(DateFormat); 

// Initialize mongo integration must

var mongo = require('mongodb');
var connString = 'mongo ds111940.mlab.com:11940/gtechbot -u gtech-p gtech';
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dbm;
var collResponses;
var collTickes;
var collCategories;
var collOrgs;
var collUsers;

// Initialize connection once

mongo.MongoClient.connect(connString, function(err, database) {
  if(err) throw err;
 
  dbm = database;

  collResponses = dbm.collection('Responses');
  collTickes = dbm.collection('Tickes');
  collCategories = dbm.collection('Categories');
  collOrgs = dbm.collection('Orgs');
  collUsers = dbm.collection('Users');

});




var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// Intercept trigger event (ActivityTypes.Trigger)
bot.on('trigger', function (message) {
    // handle message from trigger function
    var queuedMessage = message.value;
    var reply = new builder.Message()
        .address(queuedMessage.address)
        .text('This is coming from the trigger: ' + queuedMessage.text);
    bot.send(reply);
});



var instructions = 'Welcome to BuilderBot! This is an ALPHA version for a mighty efficiant Bot to scale the process of planning a new bot or to enhance an existing one. to showcase the DirectLine: Send \'myBot\' to see the list of questions or \'myUsers\' to see how the list of regitered users. Any other message will be echoed.';

bot.on('conversationUpdate', function (activity) {
    if (activity.membersAdded) {
        activity.membersAdded.forEach((identity) => {
            if (identity.id === activity.address.bot.id) {
                var reply = new builder.Message()
                    .address(activity.address)
                    .text(instructions);
                bot.send(reply);
            }
        });
    }
});





bot.dialog('/', [
    function (session) {


    var reply = new builder.Message()
        .address(session.message.address);

    var text = session.message.text.toLocaleLowerCase();
    switch (text) {
        case 'show me a hero card':
            reply.text('Sample message with a HeroCard attachment')
                .addAttachment(new builder.HeroCard(session)
                    .title('Sample Hero Card')
                    .text('Displayed in the DirectLine client'));
            break;

        case 'send me a botframework image':
            reply.text('Sample message with an Image attachment')
                .addAttachment({
                    contentUrl: 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png',
                    contentType: 'image/png',
                    name: 'BotFrameworkOverview.png'
                });

            break;

        default:
            reply.text('You said \'' + session.message.text + '\'');
            break;
    }

    session.send(reply);

        builder.Prompts.text(session, "Welcome to BuilderBot... I'm here to help you build and configure my son Bot :), but first: What's your email?");

    },
    function (session, results) {

        UserEmail = results.response;

        session.userData.email = UserEmail;

        session.send("Thank you" + UserEmail);

        AllocateUserEmail();

        function AllocateUserEmail() {
                
                var cursor = collUsers.find({"UserEmail": UserEmail});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;
                    if (doc === null) {
                        // doc is null when the last document has been processed

                        if (result.length < 1) {

                            NonRegisteredUser();

                        } else {

                            UserExistsByEmail();

                            UserName = result[0].UserName;
                            UserGoal = result[0].UserGoal;
                            UserID = result[0]._id;

                        }
                        
                        return;
                    }
                    // do something with each doc, like push Email into a results array
                    result.push(doc);
                });
            
        }


        function NonRegisteredUser() {
            /*
            var UserRecord = {
                'CreatedTime': LogTimeStame,
                'CreatedBy':'admin',
                'ObjectType':'UserRecord',
                'UserEmail':UserEmail,
                'ObjectFormat':'txt',
                'Status':'draft'
            }    	
            
            collUsers.insert(UserRecord, function(err, result){
                //session.userData.userid = result._id;
                UserID = result._id;
                session.send("New user created: " + result._id);
                //session.userData.email = UserEmail;
            });
            */

            builder.Prompts.text(session, "And you name?"); 

        }

        function UserExistsByEmail() {

            session.userData.email = results.response;
            session.userData.name = UserName;
            session.userData.goal = UserGoal;
            builder.Prompts.text(session, "Good to have you back with me! Are you ready to scale your bot?"); 

         }



    },    
    function (session, results) {

        UserName = results.response;
        session.userData.name = UserName;

        builder.Prompts.choice(session, "Bots are the obvious method to create valuble discussion with the new users, what do you want to scale??", ["discussion", "Conversion $", "Presense"]);
    },

    function (session, results) {

        UserGoal = results.response.entity;

        session.userData.goal = UserGoal;

        RegisterNewUser();

        function RegisterNewUser() {

            UserID = new mongo.ObjectID(); 

            session.send("Got it... " + UserID);

            var UserRecord = {
                'CreatedTime': LogTimeStame,
                '_id': UserID,
                'CreatedBy':'admin',
                'ObjectType':'UserRecord',
                'UserName':UserName,
                'UserEmail':UserEmail,
                'UserGoal':UserGoal,
                'ObjectFormat':'txt',
                'Status':'draft'
            }    	
            
            collUsers.insert(UserRecord, function(err, result){

                session.userData.userid = UserID;

                //AllocateUserData();

               // session.send("New user created: " + result);
               

            });



            //session.send("New user created1: " + UserID);

            //session.send("New user created2: " + session.userData.userid);

            session.send("Thank you for sharing this information with me. Ready to start your first bot?"); 

           // session.send("Got it... " + session.userData.name + 
           // " your email address is: " + session.userData.email + 
           // " and your bot will help you increase  " + session.userData.goal + ".");
            session.beginDialog("/location", { location: "path" });

        }


        

        

    }
]).beginDialogAction('checkoutAction', 'checkoutDialog', { matches: /checkout/i });

// Dialog for checking out
    bot.dialog('checkoutDialog', function (session) {
        session.send("Got it... ");
    });






/*

// Handle message from user
bot.dialog('/', function (session) {
    var queuedMessage = { address: session.message.address, text: session.message.text };
    // add message to queue
    session.sendTyping();
    var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage);
    queueSvc.createQueueIfNotExists('bot-queue', function(err, result, response){
        if(!err){
            // Add the message to the queue
            var queueMessageBuffer = new Buffer(JSON.stringify(queuedMessage)).toString('base64');
            queueSvc.createMessage('bot-queue', queueMessageBuffer, function(err, result, response){
                if(!err){
                    // Message inserted
                    session.send('Your message (\'' + session.message.text + '\') has been added to a queue, and it will be sent back to you via a Function');
                } else {
                    // this should be a log for the dev, not a message to the user
                    session.send('There was an error inserting your message into queue');
                }
            });
        } else {
            // this should be a log for the dev, not a message to the user
            session.send('There was an error creating your queue');
        }
    });

});

*/

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}


