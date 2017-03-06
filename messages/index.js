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
var nodemailer = require('nodemailer');

// Initialize mongo integration must

var mongo = require('mongodb');
var connString = 'mongodb://gtech:gtech@ds111940.mlab.com:11940/gtechbot';
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dbm;
var collResponses;
var collTickets;
var collCategories;
var collOrgs;
var collUsers;
var collAdminRequests;
var collTicketResponses;
var collLog;

// Initialize connection once

mongo.MongoClient.connect(connString, function(err, database) {
  if(err) throw err;
 
  dbm = database;

  collResponses = dbm.collection('Responses');
  collTickets = dbm.collection('Tickets');
  collCategories = dbm.collection('Categories');
  collOrgs = dbm.collection('Orgs');
  collUsers = dbm.collection('Users');
  collAdminRequests = dbm.collection('AdminRequests');
  collTicketResponses = dbm.collection('TicketResponses');
  collLog = dbm.collection('SysLog');


  // Initialize indexes for Free Search queries

collTickets.dropIndexes(
	
	function (err, result) {
      if (err) throw err;
      //console.log(result);
   });


	collTickets.createIndex( 

        {"$**":"text"},
	
	function (err, result) {
      if (err) throw err;
   });


collTicketResponses.dropIndexes(
	
	function (err, result) {
      if (err) throw err;
      //console.log(result);
   });


	collTicketResponses.createIndex( 

        {"$**":"text"},
	
	function (err, result) {
      if (err) throw err;
   });



});




var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});


var bot = new builder.UniversalBot(connector);

//var bot = new builder.UniversalBot(connector, function (session) {
 //   session.send("You said: '%s'. Try asking for 'help'.", session.message.text);
//});




var UserEmail;
var EmailError;
var UserName;
var UserOrg;
var UserID;
var TicketID;
var ResponseTimeFrameLabel;
var OrgType;
var OrgName;
var OrgID;
var ResponseID;
var numberOfTickets;
var nonHandledObjects
var responses;
var ticketsArray = [];
var TicketNumber;




// Intercept trigger event (ActivityTypes.Trigger)
bot.on('trigger', function (message) {
    // handle message from trigger function
    var queuedMessage = message.value;
    var reply = new builder.Message()
        .address(queuedMessage.address)
        .text('This is coming from the trigger: ' + queuedMessage.text);
    bot.send(reply);
});


/*
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

*/



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
            //reply.text('You said \'' + session.message.text + '\'');
            break;
    }

    session.send(reply);

        if (session.userData.Authanticated != 'True') {

        session.sendTyping();

        session.send("Welcome! my name is SupBot and I will do my best to assist you.");

        session.sendTyping();

        session.send( "Also, you are welcome to use my HOT KEYS to skip my over politeness, to review them just type '/help' ");

        session.sendTyping();

        session.beginDialog("/validateUser"); 

        } else {

            session.beginDialog("/location", { location: "repath" });

        }

    },
    function (session, results) {

        if (session.userData.emailValidated == 'True') {

            session.beginDialog("/signin"); 

        } else if (session.userData.emailValidated == 'False') {

            session.send("I'm sorry, but I can't find your email on my lists..");

            session.beginDialog("/ErrorAllocateEmail"); 

        } else if (session.userData.emailValidated == 'Error') {

            session.send("Thank you for your patiance");

            session.userData.emailValidated = '';

        }

    },    
    function (session, results) {

        if (session.userData.Authanticated == 'True') {

            session.beginDialog("/location", { location: "path" });

        } 
    },

    function (session, results) {



    }
]);



bot.dialog('/validateUser', [
    function (session) {

            builder.Prompts.text(session, "Let me just quickly find you on my lists... remind me, what is your email? ");

    },
    function (session, results) {

       UserEmail = results.response.toLocaleLowerCase();

       EmailError =  results.response.toLocaleLowerCase();

       session.sendTyping();

       AllocateUserEmail();



        function AllocateUserEmail() {
                
                var cursor = collUsers.find({"Email": UserEmail});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;
                    if (doc === null) {
                        // doc is null when the last document has been processed

                        if (result.length == 1) {

                            session.userData.emailValidated = 'True';

                            UserName = result[0].Name;
                            UserOrg = result[0].Org;
                            UserID = result[0]._id;

                            NextToSignIn();                            

                        } else {

                            session.userData.emailValidated = 'False';

                            session.userData.email = "";

                            EmailNotFound();                           

                        }  
                        
                        return;
                    }
                    // do something with each doc, like push Email into a results array
                    result.push(doc);
                });
            
        }




        function NextToSignIn() {

            if (session.userData.emailValidated == 'True') {

               session.send("Good to have you back with me " + UserName); 

               session.endDialog();

            }

        } 


        function EmailNotFound() {


                session.endDialog();

        }                  


    }
]);






bot.dialog('/signin', [
    function (session) {

            builder.Prompts.text(session, "And your password?");

    },
    function (session, results) {

        var UserPass = results.response;

        session.send("Great! And don't worry, I will keep your privacy...");

        ExecuteLogin();



        function ExecuteLogin() {
                
                var cursor = collUsers.find({"Email": UserEmail, "Password" : UserPass});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;
                    if (doc === null) {
                        // doc is null when the last document has been processed

                        if (result.length < 1) {

                            session.userData.Authanticated = 'False';

                            SendInfoToExistingUser(); 

                        } else {

                            session.userData.emailValidated == 'False'

                            session.userData.Authanticated = 'True';

                            GetUserTicketingInfo();                          

                        }  
                        
                        return;
                    }
                    // do something with each doc, like push Email into a results array
                    result.push(doc);
                });
            
        }


        function GetUserTicketingInfo() {

                var cursor = collTickets.find({"UserID": UserID});
                var result = [];
                    cursor.each(function(err, doc) {
                              if(err)
                                    throw err;
                              if (doc === null) {

                                    numberOfTickets = result.length;

                                    //GetUserNonHandlededObjects();

                              }
                              result.push(doc);
                    });

                    GetUserNonHandlededObjects();


        }

        function GetUserNonHandlededObjects() {

                var cursor = collTicketResponses.find({"UserID": UserID, "Status": "unread"});
                var result = [];
                    cursor.each(function(err, doc) {
                              if(err)
                                    throw err;
                              if (doc === null) {

                                    nonHandledObjects = result.length;

                                    //SendInfoToExistingUser();

                              }
                              result.push(doc);
                    });

                    SendInfoToExistingUser();


        }



        

        function SendInfoToExistingUser() {

            if (session.userData.Authanticated == 'True') {

               session.send("Good to have you back with me " + UserName + "! You have " + numberOfTickets + " open tickets and " + nonHandledObjects + " responses from me and you still didn't review."); 

            } else {

                session.send("I think that I don't really know you...");

            }

            session.endDialog();

        }         


    }
]);







bot.dialog('/validateOrg', [
    function (session) {

            builder.Prompts.text(session, "Let me just quickly find you on my lists... remind me, what is your email? ");

    },
    function (session, results) {

        UserEmail = results.response.toLocaleLowerCase();

        session.userData.email = UserEmail;

        session.send("Thank you");

        AllocateUserEmail();

        

        function AllocateUserEmail() {
                
                var cursor = collUsers.find({"Email": UserEmail});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;
                    if (doc === null) {
                        // doc is null when the last document has been processed

                        if (result.length < 1) {

                            builder.Prompts.text(session, "And you name?"); 

                        } else {

                            session.userData.Authanticated = 'True';

                            UserName = result[0].Name;
                            UserOrg = result[0].Org;
                            UserID = result[0]._id;

                            GetUserTicketingInfo();

                            function GetUserTicketingInfo() {

                                    var cursor = collTickets.find({"UserID": UserID});
                                    var result = [];
                                    cursor.each(function(err, doc) {
                                        if(err)
                                            throw err;
                                        if (doc === null) {

                                            var numberOfTickets = result.length;

                                            SendInfoToExistingUser(numberOfTickets);

                                            //return;
                                        }
                                        // do something with each doc, like push Email into a results array
                                        result.push(doc);
                                    });


                            }

                            function SendInfoToExistingUser(numberOfTickets) {

                                session.send("Good to have you back with me " + UserName + "! You have " + numberOfTickets + " open tickets must be resolved."); 

                                session.beginDialog("/location", { location: "path" });

                            }                            

                        }  
                        
                        return;
                    }
                    // do something with each doc, like push Email into a results array
                    result.push(doc);
                });
            
        }

        function UserExistsByEmail() {

            builder.Prompts.text(session, "Good to have you back with me!"); 

            session.beginDialog("/location", { location: "path" });

         }



    }
]);






bot.dialog('/ErrorAllocateEmail', [
    function (session) {

        builder.Prompts.text(session, "I need to contact my supervisor and ask for his advice. Any comments that you would like me to share with him?");

    },
    function (session, results) {

            var AdmibRequestID = new mongo.ObjectID(); 

                var ErrorRecord = {
                    'CreatedTime': LogTimeStame,
                    '_id': AdmibRequestID,
                    'Email': EmailError,
                    'Comments': results.response,
                    'RequestType':'loginAuth_error_EmailnotAuthanticated'
                }    	
                
                collLog.insert(ErrorRecord, function(err, result){

                }); 

            session.sendTyping();               

            session.send("Ok, I've just notified my supervisor and he said he will cantact you directly within the next 24 hours. ");

            session.sendTyping();

            session.send("I hope that helps... Goodbye.");

            session.userData.emailValidated = 'Error';

            session.endDialog();
     
    }
]);









var paths = {

    "path": { 
        description: "So now, how can I help you?",
        commands: { "You owe me an answer on a ticket": "feedback", "I have a question": "question", "I have a tech. problem": "support", "I have a request": "request", "I want to brainstorm with someone[soon]": "soon", "Call me back ASAP[soon]": "soon"  }
    },

    "repath": { 
        description: "Anything else I can I help you with?",
        commands: { "You owe me an answer on a ticket": "feedback", "I have another question": "question", "I have another tech. problem": "support", "I have another request": "request", "I want to brainstorm with someone[soon]": "soon", "Call me back ASAP[soon]": "soon"  }
    }, 

    "reAdminAuth": { 
        description: "Woul you like try again with me?",
        commands: { "Yes": "reAdminLogin", "Reset my token": "resettoken", "Go back to my tickets": "mytickets" , "Goodbye": "goodbye"   }
    },

    "feedback": { 
        description: "Help me to help you allocate the relevant ticket, ok?",
        commands: { "OK and I have a ticket Number": "feedbackwithTicketNo", "OK, show me the list of tickets with unread responses": "feedbackwithoutTicketNo" }
    }, 

            "feedbackwithTicketNo": { 
                description: "What is the severity of your question?",
                commands: { "Urgent": "urgentques", "Normal": "normalques"  }
            }, 

            "feedbackwithoutTicketNo": { 
                description: "What is the severity of your question?",
                commands: { "Urgent": "urgentques", "Normal": "normalques"  }
            },                   

    "request": { 
        description: "Your request is about...:",
        commands: { "Org Not Found?": "orgnotfound", "My User?": "setuserasadmin", "Else": "requestelse"  }
    }, 

    "question": { 
        description: "Your question is related to:",
        commands: { "Prod App": "prodapp", "Dev App": "devapp", "CR": "newcr"  }
    },  

            "prodapp": { 
                description: "What is the severity of your question?",
                commands: { "Urgent": "urgentques", "Normal": "normalques"  }
            },  

            "devapp": { 
                description: "What is the severity of your question?",
                commands: { "Urgent": "urgentques", "Normal": "normalques"  }
            },   

             "newcr": { 
                description: "What is the severity of your question?",
                commands: { "Urgent": "urgentques", "Normal": "normalques"  }
            } ,                           


    "support": { 
        description: "I guess that you need my help with a technical issue, right? what is it related to:",
        commands: { "Prod App": "prodapp", "Dev App": "devapp", "CR": "newcr"  }
    }, 

    "callmeback": { 
        description: "OK.. ok... calm down, I will find an availble humen being and ask him to call you ASAP...",
        commands: { "OK": "OKcallmeback", "OK and Let me open a ticket": "path", "Goodbye": "bye"  }
    }, 

    "userAttachment": { 
        description: "Please provide an attachement",
        commands: { "OK": "something", "NO": "somethingno" }
    },  

}






bot.dialog('/location', [
    function (session, args) {
        var location = paths[args.location];
        session.dialogData.commands = location.commands;
        builder.Prompts.choice(session, location.description, location.commands);
    },
    
    function (session, results) {

        session.sendTyping();
        
        var destination = session.dialogData.commands[results.response.entity];

        if (destination == 'repath') {

            session.replaceDialog("/location", { location: destination });

        } else if (destination == 'question' || destination == 'support' || destination == 'request' || destination == 'feedback') {

            session.sendTyping();

            if (destination == 'question' || destination == 'request' || destination == 'feedback') {

                session.send("Got it, you have a " + destination + " for me..");

            } else {

                session.send("Got it, you need my " + destination);

            }

            session.userData.engagementReason = destination;

            session.replaceDialog("/location", { location: destination });       

        } else if (destination == 'prodapp' || destination == 'devapp' || destination == 'newcr') {

            session.sendTyping();

            session.send("Good to know! now I have a context and might be able to quickly answer any of your questions.");

            session.userData.engagementReasonAppType = destination;

            session.replaceDialog("/location", { location: destination });

        } else if (destination == 'urgentques' || destination == 'normalques') {

            session.sendTyping();

            session.send("Ok thanks, now I can repriorities my other tasks..");

                if (destination == 'urgentques') {

                    ResponseTimeFrameLabel = "the next 4 hours ";

                } else {

                    ResponseTimeFrameLabel = "by the next following day ";

                }

            session.userData.engagementReasonSevirityLevel = destination;

            session.beginDialog("/getUserQuestion");

        } else if (destination == 'soon') {

            session.send("Can't you be patiant? I'm working hard to get this done for you...");

            session.replaceDialog("/location", { location: repath });

        } else if (destination == 'userAttachment') {

            session.beginDialog("/getUserAttachQuestion");

        } else if (destination == 'mytickets') {

            session.beginDialog("/myTickets");

        } else if (destination == 'goodbye') {

            session.beginDialog("logoutDialog");

        } else if (destination == 'reAdminLogin') {

            session.beginDialog("/adminAuth");

        } else if (destination == 'resettoken') {

            session.beginDialog("/adminResetToken");

        } else if (destination == 'OKcallmeback') {

            session.beginDialog("/adminReqToCallBack");

        } else if (destination == 'feedbackwithTicketNo') {

           session.beginDialog("/UserResponseToTicket");

        } else if (destination == 'feedbackwithoutTicketNo') {

           session.beginDialog("/respondToMtyTicket");

        } else if (destination == 'orgnotfound' || destination == 'setuserasadmin' || destination == 'requestelse' ) {

            session.userData.AdminReqType = destination;

            session.beginDialog("/adminGenReq");

        }
        
    }
]);



bot.dialog('/UserResponseToTicket', [

    function (session) {

        session.sendTyping();

        nTickckNumber = parseInt(TicketNumber);


                var cursor = collTickets.find({ "ObjectNo" : nTickckNumber});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nresultLen = result.length;

                    if (nresultLen > 0 ) {

                        

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[0].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[0].ObjectNo)
                                        .subtitle(result[0].ObjectTxt)
                                        .text("Status: " + result[0].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[0].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[0].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[0].ObjectNo, "Review")
                                        ])
                                ]);
                            session.send(msg);

                        



                       // builder.Prompts.text(session, "Please provide me with the ticket number to load: "); 
                        
                    } else {

                        session.send("I couldn't find your ticket...");

                        session.beginDialog("/location", { location: "repath" });

                    }

                        return;
                    }
                    
                    result.push(doc);
                });  


    },
    function (session, results) {

        if (session.userData.adminAuth = 'True') {

            var ticketNO = results.response;

            session.send("The chosen ticket is: " + ticketNO);

            session.userData.ticketNumberToHandle = ticketNO;  

            builder.Prompts.text(session, "Your response will be:  ");   

        }
            
    },    
    function (session, results) {

        var TicketResponse = results.response;
        var ticketNumberToHandle = session.userData.ticketNumberToHandle;

        ResponseID = new mongo.ObjectID(); 

            var TicketResponseRecord = {
                'CreatedTime': LogTimeStame,
                'UserID': UserID,
                '_id': ResponseID,
                'CreatedBy':UserName,
                'CreatedByEmail':UserEmail,
                'TicketNo':ticketNumberToHandle,
                'ObjectFormat':'txt',
                'ObjectTxt':TicketResponse,
                'Status':'unread'
            }    	
            
            collTicketResponses.insert(TicketResponseRecord, function(err, result){

            }); 

            session.endDialog();  
        
    },
]);






bot.dialog('/getUserQuestion', [

    function (session) {

            builder.Prompts.text(session, "So... what are you waiting for? ask me anything... "); 

    },
    function (session, results) {

        if (results.response) {

            TicketID = new mongo.ObjectID(); 

            TicketNumber = Math.floor(Math.random()*90000) + 10000;

            var TicketRecord = {
                'CreatedTime': LogTimeStame,
                'UserID': UserID,
                '_id': TicketID,
                'CreatedBy':UserName,
                'CreatedByEmail':UserEmail,
                'ObjectNo':TicketNumber,
                'ObjectReason':session.userData.engagementReason,
                'ObjectType':session.userData.engagementReasonAppType,
                'ObjectSevirityLevel':session.userData.engagementReasonSevirityLevel,
                'ObjectFormat':'txt',
                'ObjectTxt':results.response,
                'Status':'new'
            }    	
            
            collTickets.insert(TicketRecord, function(err, result){

            });



           builder.Prompts.attachment(session, 'Can you attach a screeshot that will help me better understanbd your request?');
            
        } 
    },
    function (session, results) {

         if (results.response) {

                session.send('File received.');

                var o_ID = new mongo.ObjectID(TicketID); 

                var thumbnailUrl = results.response[0].thumbnailUrl;

                var contentUrl = results.response[0].contentUrl;

                        collTickets.update (
                        { "_id": o_ID },
                       // { $set: { 'attachement': results.response, 'AttachmentUploadDate':LogTimeStame }}
                       // { $push: { Files: { $each: [  results.response  ] } } }
                        { $push: { Files: { $each: [  {thumbnailUrl: thumbnailUrl, contentUrl: contentUrl, "AttachmentUploadDate" :LogTimeStame, "FileType" : "ticketAttachment" } ] } } }
                        )

                         session.send("Nice one! Thanks...");

                        session.beginDialog("/location", { location: "repath" });

                } else {

                    session.send("I guess not...");

                    session.beginDialog("/location", { location: "repath" });
            
        } 
    }
]);






bot.dialog('helpDialog', function (session, args) {

    if (args.topic == 'help' && session.userData.Authanticated == 'True') {

        session.sendTyping();

        session.send("use '/home' to acknoledge me about your need for assitance");

        session.send("use '/sticket' - to ask to perform a simple search to allocate one or more tickets");

        session.send("use '/mtickets' - to get a list of your tickets");

        session.send("use '/otickets' - to get a list of your open tickets");

        session.send("use '/logout' - to end our current discussion and start a new one");

        session.send("use '/reset' - to reset your password");

        session.send("use '/adminmode' - well...this is a restricted area and for authorized users only.");

        session.send("use '/beadmin' - and I can promise to consider your request");

        session.endDialog("Looking forward to your decision :)");

    } else {

        session.text("I share only with poeple that I know... let's try again?");

        session.beginDialog("/validateUser"); 


    }   
    
}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/help':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'help' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});


bot.dialog('homeDialog', function (session, args) {

    session.endDialog();

    if (args.topic == 'home') {

        session.beginDialog("/");

    } 

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/home':
                callback(null, 1.0, { topic: 'home' });              
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});

bot.dialog('logoutDialog', function (session, args) {

    session.endDialog("Goodbye.... I'm ending our conversation now by logging out...");

    if (args.topic == 'logout') {

        session.endConversation();

        session.userData.Authanticated = 'False';

        session.userData.adminTokenReset == 'False';

        session.userData.emailValidated == 'False'; 

        session.beginDialog("/");

    }

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/logout':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'logout' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});


bot.dialog('myticketsDialog', function (session, args) {
    
    session.endDialog();

    session.beginDialog("/myTickets");

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/mtickets':
                callback(null, 1.0, { topic: 'mytickets' });             
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});

bot.dialog('myOpenticketsDialog', function (session, args) {
    
    session.endDialog();

    session.beginDialog("/myOpenTickets");

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/otickets':
                callback(null, 1.0, { topic: 'myopentickets' });                
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});







bot.dialog('resetDialog', function (session, args) {

    if (args.topic == 'ResetPassword') {

        session.endDialog();

        session.beginDialog("/ResetPassword");

    }

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/reset':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'ResetPassword' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});



bot.dialog('/ResetPassword', [

    function (session) {

        builder.Prompts.text(session, "What is your current Email?");
 

    },
    function (session, results) {

         session.send("A new password was sent to your email.");

         session.endConversation();

         session.beginDialog("/");         

    }
]);




bot.dialog('/myTickets', [
    function (session) {

        session.send("Your tickets: ");

        var o_ID = new mongo.ObjectID(UserID); 

        var cursor = collTickets.find({"UserID": o_ID});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

            //   for (var i=0; i<nresultLen; i++ ) {

            //       session.send(result[i].ObjectNo + ": " + result[i].ObjectTxt + " | " + result[i].Status);

            //   }

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }






                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        }); 

    },
    function (session, results) {

            session.beginDialog("/location", { location: "repath" });

    }
]);






bot.dialog('/myOpenTickets', [
    function (session) {

        session.send("Your open tickets: ");

        var o_ID = new mongo.ObjectID(UserID);

        var cursor = collTickets.find({"UserID": o_ID, "Status" : "new"});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }



                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });      

    },
    function (session, results) {

            session.beginDialog("/location", { location: "path" });
            
    }
]);






bot.dialog('/AdminClosedtickets', [
    function (session) {

        session.send("Admin Mode: Closed tickets: ");

        var cursor = collTickets.find({"Status" : "Closed"});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }



                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });      

    },
    function (session, results) {

            session.beginDialog("/location", { location: "path" });
            
    }
]);


bot.dialog('/AdminNewtickets', [
    function (session) {

        session.send("Admin Mode: new tickets: ");

        var cursor = collTickets.find({"Status" : "new"});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }



                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });      

    },
    function (session, results) {

            session.beginDialog("/location", { location: "path" });
            
    }
]);



bot.dialog('/AdminInProcesstickets', [
    function (session) {

        session.send("Admin Mode: In-Process tickets: ");

        var cursor = collTickets.find({"Status" : "In Process"});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

                        for (var i=0; i<nresultLen; i++ ) {

                            //var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }



                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });      

    },
    function (session, results) {

            session.beginDialog("/location", { location: "path" });
            
    }
]);



bot.dialog('/adminAuth', [

    function (session) {

        session.sendTyping();

        session.send("Welcome to my admin mode! This is a restricted area and requires GTECH authorization to access. ");

        builder.Prompts.text(session, "Your access token:"); 

    },
    function (session, results) {

        var cursor = collUsers.find({"Email": UserEmail});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;

            if (doc === null) {

               var nresultLen = result.length;

               if (results.response == result[0].Token ) {

                   session.userData.adminAuth = 'True';

                   session.send("Thank you. I was able to allocate your admin previliges. ");

                   session.beginDialog("/AdminActions");

               } else {

                   session.send("Sorry, but I was unable to allocate your admin previliges. ");

                   session.beginDialog("/location", { location: "reAdminAuth" });

               }

                return;
            }
            
            result.push(doc);
        });        
            
    }
]);




bot.dialog('/adminResetToken', [

    function (session) {

        session.sendTyping();

        session.send("So you want me to reset your token? Well no problem by just remember that tokens are granted to FLAGGED users only...");


                var cursor = collUsers.find({"_id": UserID});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nTokenResult = result[0].Token;

                    if (nTokenResult > 0 ) {

                        session.userData.adminTokenReset = 'True';

                    } else {

                        session.send("And after I checked, but I was unable to allocate your admin previliges. ");

                        session.beginDialog("/location", { location: "reAdminAuth" });

                    }

                        return;
                    }
                    
                    result.push(doc);
                });  


    },
    function (session, results) {

        if (session.userData.adminTokenReset == 'True') {

            var Token = Math.floor(Math.random()*90000) + 10000;

            var TokenRecord = {
                'TokenCreatedTime': LogTimeStame,
                '_id': UserID,
                'Token':Token
            }    	
            
            collUsers.upsert(TokenRecord, function(err, result){

            });

        }

        session.userData.adminTokenReset = 'False';

        session.send("Your new token is: " + Token);

        session.beginDialog("/location", { location: "reAdminAuth" });
            
    }
]);






bot.dialog('adminDialog', function (session, args) {

    session.endDialog( "Admin mode: " + args.topic);

    if (args.topic == 'CreateNewOrg') {

        session.endDialog();

        session.beginDialog("/CreateNewOrg");

    }

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/createorg':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'CreateNewOrg' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});


bot.dialog('/CreateNewOrg', [
    function (session) {

        builder.Prompts.choice(session, "Organization type?", ["Business", "Filantropic", "Else"]);

    },
    function (session, results) {

        OrgType = results.response.entity;

        session.endDialog();

        session.beginDialog("/DefineNewOrgName");
            
    }
]);





bot.dialog('adminModeDialog', function (session, args) {

            session.endDialog();

            if (session.userData.adminTokenReset == 'True') {

                session.beginDialog("/AdminActions");


            } else {

                session.beginDialog("/adminAuth");
            }

            

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/adminmode':
                callback(null, 1.0, { topic: 'adminmode' });                 
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});


bot.dialog('beAdminModeDialog', function (session, args) {

            session.endDialog();

            session.beginDialog("/adminAuthRequests");


}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/beadmin':
                callback(null, 1.0, { topic: 'beadmin' });                 
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});



bot.dialog('SearchTicketDialog', function (session, args) {

            session.endDialog();

            session.beginDialog("/SearchTicket");


}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/sticket':
                callback(null, 1.0, { topic: 'sticket' });                 
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});







bot.dialog('/SearchTicket', [
    function (session) {

        session.send("Ok, I will perform a deep search within your tickets by any word / phrase or number that might be included within our long term relationship. ");

        builder.Prompts.text(session, "So bring it on..");      

    },
    function (session, results) {

        var SearchValue = results.response.toString();

        var o_ID = new mongo.ObjectID(UserID);

            var cursor = collTickets.find({ "UserID" : o_ID, $text: {$search: SearchValue}});

                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nresultLen = result.length;



                    if (nresultLen > 0 ) {

                        session.send("Ready? so this is what I was able to find:");

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }
                        
                    } else {

                        session.send("I was unable to find anything...");

                    }

                        return;
                    }
                    
                    result.push(doc);
                }); 

            
    }
]);


bot.dialog('/AddCommentToTicket', [
    function (session, args) {

        TicketNumber = args.data;

        session.endDialog();

        session.beginDialog("/UserResponseToTicket");
    }
]);
bot.beginDialogAction('comment', '/AddCommentToTicket'); 




bot.dialog('/ReviewTicket', [
    function (session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
bot.beginDialogAction('review', '/ReviewTicket'); 




bot.dialog('/CloseTicket', [
    function (session, args) {

        var nticketNumberToHandle = parseInt(args.data);

        collTickets.update (
        { "ObjectNo": nticketNumberToHandle },
        { $set: { 'Status': 'Closed', 'ChangedDate':LogTimeStame } })

        session.endDialog("Ticket %s is now set to 'Closed'", args.data);
    }
]);
bot.beginDialogAction('close', '/CloseTicket'); 



bot.dialog('/ReOpenTicket', [
    function (session, args) {

        var nticketNumberToHandle = parseInt(args.data);

        collTickets.update(
        { "ObjectNo": nticketNumberToHandle },
        { $set: { 'Status': 'new', 'ChangedDate':LogTimeStame } })

        session.endDialog("Ticket %s is now set to 'Open'", args.data);
    }
]);
bot.beginDialogAction('reopen', '/ReOpenTicket'); 





bot.dialog('/AdminSearchTicket', [
    function (session) {

        builder.Prompts.text(session, "Admin Search - So bring it on..");      

    },
    function (session, results) {

        var SearchValue = results.response.toString();

            var cursor = collTickets.find({ $text: {$search: SearchValue}});

                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nresultLen = result.length;



                    if (nresultLen > 0 ) {

                        session.send("Ready? so this is what I was able to find:");

                        for (var i=0; i<nresultLen; i++ ) {

                            var thumbImg = "http://www.reedyreels.com/wp-content/uploads/2015/08/ticket-icon-RR-300x252.png";

                            //var thumbImg;

                            if (result[i].Files != undefined) {

                                    thumbImg = result[i].Files[0].thumbnailUrl;

                            }

    
                            var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachments([
                                    new builder.ThumbnailCard(session)
                                        .title('Ticket Card No: ' + result[i].ObjectNo)
                                        .subtitle(result[i].ObjectTxt)
                                        .text("Status: " + result[i].Status)
                                        .images([
                                            builder.CardImage.create(session, thumbImg)
                                        ])
                                        //.tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                                        .buttons([
                                            builder.CardAction.dialogAction(session, "close", result[i].ObjectNo, "Close"),
                                            builder.CardAction.dialogAction(session, "reopen", result[i].ObjectNo, "Re-Open"),
                                            builder.CardAction.dialogAction(session, "review", result[i].ObjectNo, "Review"),
                                            builder.CardAction.dialogAction(session, "comment", result[i].ObjectNo, "Comment")
                                        ])
                                ]);
                            session.send(msg);

                        }
                        
                    } else {

                        session.send("I was unable to find anything...");

                    }

                        return;
                    }
                    
                    result.push(doc);
                }); 

            
    }
]);










bot.dialog('/AdminActions', [
    function (session) {
        

        builder.Prompts.choice(session, "Admin mode: Administrator functions", ["Respond To Ticket", "Search Ticket", "Create New User", "User List", "New Tickets" , "In-Process Tickets", "Closed Tickets"]);

    },
    function (session, results) {

        var adminActions = results.response.entity;

        if (adminActions == 'Search Ticket') {

            session.beginDialog("/AdminSearchTicket");

        } else if (adminActions == 'Create New User') {

            session.beginDialog("/CreateNewUser");
            
        } else if (adminActions == 'User List') {

            session.beginDialog("/GetUserList");
            
        } else if (adminActions == 'Respond To Ticket') {

            session.beginDialog("/respondToTicket");
            
        } else if (adminActions == 'New Tickets') {

            session.beginDialog("/AdminNewtickets");
            
        } else if (adminActions == 'In-Process Tickets') {

            session.beginDialog("/AdminInProcesstickets");
            
        } else if (adminActions == 'Closed Tickets') {

            session.beginDialog("/AdminClosedtickets");
            
        }
     
    },
    function (session, results) {

        if (session.userData.newUserRecord == "True") {

            session.send("Yeah! I was able to create the new user record successfully!");

            session.beginDialog("/AdminActions");

            session.userData.newUserRecord = "False";


        } else if (session.userData.GetUserList == "True") {

            session.beginDialog("/AdminActions");

            session.userData.GetUserList = "False";

        } else {

            session.send("[Admin mode:] Let me show you a quick preview on the ticket..");
            
            session.beginDialog("/ticketPreview"); 

        }


            
    },
    function (session, results) {

        var adminAction = session.userData.adminAction;
        
        if (adminAction == "Change ticket status") {

            session.beginDialog("/changeTicketStatus"); 

        } else {

            session.beginDialog("/AdminActions"); 

        }
                    
    },
    function (session, results) {

            session.send("Ticket was updated suceesfully");

            session.beginDialog("/AdminActions"); 
                    
    }

]);









bot.dialog('/changeTicketStatus', [

    function (session) {

        var ticketNumberToHandle = session.userData.ticketNumberToHandle;

        session.send("The current ticket no. is: " + ticketNumberToHandle);

        builder.Prompts.choice(session, "Change the ticket status to: ", ["Closed", "In Process", "Pending Customer Response"]);


    },
    function (session, results) {

        var ticketStatus = results.response.entity;

        var ticketNumberToHandle = session.userData.ticketNumberToHandle;

        var nticketNumberToHandle = parseInt(ticketNumberToHandle);

        collTickets.update(
        { "ObjectNo": nticketNumberToHandle },
        { $set: { 'Status': ticketStatus, 'ChangedDate':LogTimeStame } })

        session.endDialog();
      
    }
]);










bot.dialog('/respondToMtyTicket', [

    function (session) {

        session.sendTyping();

        session.send("List of your open tickets:");

        var o_ID = new mongo.ObjectID(UserID);


                var cursor = collTickets.find({ "Status" : "new", "UserID" : o_ID});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nresultLen = result.length;

                    if (nresultLen > 0 ) {

                        for (var i=0; i<nresultLen; i++ ) {

                            session.send(result[i].ObjectNo + ": " + result[i].ObjectTxt);

                            ticketsArray.push(result[i].ObjectNo);

                        }

                        builder.Prompts.text(session, "Please provide me with the ticket number to load: "); 
                        
                    } else {

                        session.send("Yu Pi Di Dey!!! There are no NEW tickets to handle!");

                        session.beginDialog("/location", { location: "reAdminAuth" });

                    }

                        return;
                    }
                    
                    result.push(doc);
                });  


    },
    function (session, results) {

            var ticketNO = results.response;

            var valdatedTicket = ticketsArray.indexOf(ticketNO);

            if (valdatedTicket>0) {

                session.send("The chosen ticket is: " + ticketNO);

                session.userData.ticketNumberToHandle = ticketNO;  

                builder.Prompts.text(session, "Your response will be:  ");  

            } else {

                session.userData.UserAuthResponse = 'false';

                session.send("I'm sorry but the ticket number you specified is not valid, let's try again.");

                session.replaceDialog("/location", { location: "path" });  

            }

 
            
    },    
    function (session, results) {

            var TicketResponse = results.response;
            var ticketNumberToHandle = session.userData.ticketNumberToHandle;

            ResponseID = new mongo.ObjectID(); 

            var TicketResponseRecord = {
                'CreatedTime': LogTimeStame,
                'UserID': UserID,
                '_id': ResponseID,
                'CreatedBy':UserName,
                'CreatedByEmail':UserEmail,
                'TicketNo':ticketNumberToHandle,
                'ObjectFormat':'txt',
                'ObjectTxt':TicketResponse,
                'Status':'unread'
            }    	
            
            collTicketResponses.insert(TicketResponseRecord, function(err, result){

            }); 

            session.userData.UserAuthResponse = 'false';

            session.send("Thank you for this, I will review your response and feedback in the next few hours.");

            session.replaceDialog("/location", { location: "repath" });  
        
    },
]);








bot.dialog('/respondToTicket', [

    function (session) {

        session.sendTyping();

        session.send("List on NEW status tickets:");


                var cursor = collTickets.find({ "Status" : "new"});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                    var nresultLen = result.length;

                    if (nresultLen > 0 ) {

                        for (var i=0; i<nresultLen; i++ ) {

                            session.send(result[i].ObjectNo + ": " + result[i].ObjectTxt);

                        }

                        builder.Prompts.text(session, "Please provide me with the ticket number to load: "); 
                        
                    } else {

                        session.send("Yu Pi Di Dey!!! There are no NEW tickets to handle!");

                        session.beginDialog("/location", { location: "reAdminAuth" });

                    }

                        return;
                    }
                    
                    result.push(doc);
                });  


    },
    function (session, results) {

        if (session.userData.adminAuth = 'True') {

            var ticketNO = results.response;

            session.send("The chosen ticket is: " + ticketNO);

            session.userData.ticketNumberToHandle = ticketNO;  

            builder.Prompts.text(session, "Your response will be:  ");   

        }
            
    },    
    function (session, results) {

        var TicketResponse = results.response;
        var ticketNumberToHandle = session.userData.ticketNumberToHandle;

        ResponseID = new mongo.ObjectID(); 

            var TicketResponseRecord = {
                'CreatedTime': LogTimeStame,
                'UserID': UserID,
                '_id': ResponseID,
                'CreatedBy':UserName,
                'CreatedByEmail':UserEmail,
                'TicketNo':ticketNumberToHandle,
                'ObjectFormat':'txt',
                'ObjectTxt':TicketResponse,
                'Status':'unread'
            }    	
            
            collTicketResponses.insert(TicketResponseRecord, function(err, result){

            }); 

            session.endDialog();  
        
    },
]);







bot.dialog('/ticketPreview', [

    function (session) {

        session.sendTyping();

        var ticketNumberToHandle = session.userData.ticketNumberToHandle;

        var nticketNumberToHandle = parseInt(ticketNumberToHandle);


                var cursor = collTickets.find({"ObjectNo": nticketNumberToHandle});
                var result = [];
                cursor.each(function(err, doc) {
                    if(err)
                        throw err;

                    if (doc === null) {

                        if (result.length > 0 ) {

                            session.send(result[0].ObjectNo + ": " + result[0].ObjectTxt);

                        } else {

                            session.send("And after I checked, but I was unable to allocate the ticket number ");

                        }

                        return;
                    }
                    
                    result.push(doc);
                }); 

                builder.Prompts.choice(session, "Your response was registered successfully! Would you like to:", ["Review current ticket", "Change ticket status", "Go back to Admin Panel"]);


    },
    function (session, results) {

        var adminAction = results.response.entity;

        if (adminAction == "Review current ticket") {

                var ticketNumberToHandle = session.userData.ticketNumberToHandle;

                var sticketNumberToHandle = ticketNumberToHandle.toString();

                        var cursor = collTicketResponses.find({"TicketNo": sticketNumberToHandle});
                        var result = [];
                        cursor.each(function(err, doc) {
                            if(err)
                                throw err;

                            if (doc === null) {

                                if (result.length > 0 ) {

                                    for (var i=0; i<result.length; i++ ) {

                                        session.send("Response: " + result[i].ObjectTxt);

                                        responses = responses + result[i].ObjectTxt + "<br />";

                                    }                                

                                } else {

                                    session.send("And after I checked, but I was unable to allocate any responses for this ticket ");

                                }

                                return;
                            }
                            
                            result.push(doc);
                        }); 

                        session.endDialog();  

        } else {

            session.userData.adminAction = adminAction;

            session.endDialog(); 

        }     

            
    }
]);







bot.dialog('/adminAuthRequests', [
    function (session) {

        builder.Prompts.text(session, "Any comments that you would like to add that I should consider?");

    },
    function (session, results) {

        if (session.userData.Authanticated == 'True') {

            var AdmibRequestID = new mongo.ObjectID(); 

                var AdminReqRecord = {
                    'CreatedTime': LogTimeStame,
                    'RequestByUserID': UserID,
                    '_id': AdmibRequestID,
                    'Comments': results.response,
                    'RequestType':'adminAuth',
                    'Name':UserName,
                    'Status':'pending'
                }    	
                
                collAdminRequests.insert(AdminReqRecord, function(err, result){

                });

            session.send("Thank you, promise to complete this one as quickly as possible and get back to you with my decision. By 'quickly' I mean not more than 24 hours... ");

            session.endDialog();

            session.beginDialog("/");

        } else {

            var AdmibRequestID = new mongo.ObjectID(); 

                var AdminReqRecord = {
                    'CreatedTime': LogTimeStame,
                    '_id': AdmibRequestID,
                    'Comments': results.response,
                    'RequestType':'adminAuth_error_notAuthanticated'
                }    	
                
                collAdminRequests.insert(AdminReqRecord, function(err, result){

                });            

            session.send("I'm sorry but in order to process your request, You have to be authanticated user. Let's start over... ");

            session.endDialog();

            session.beginDialog("/");


        }

     
    }
]);








bot.dialog('/adminGenReq', [
    function (session) {

        builder.Prompts.text(session, "Any comments that you would like to add that I should consider?");

    },
    function (session, results) {

        if (session.userData.Authanticated == 'True') {

            var AdmibRequestID = new mongo.ObjectID(); 

                var adminGenResetRecord = {
                    'CreatedTime': LogTimeStame,
                    'RequestByUserID': UserID,
                    '_id': AdmibRequestID,
                    'Comment': results.response,
                    'RequestType':session.userData.AdminReqType,
                    'Name':UserName,
                    'Status':'pending'
                }    	
                
                collAdminRequests.insert(adminGenResetRecord, function(err, result){

                });

            session.send("Thank you, I promise to process this one as quickly as possible and get back to you with a status. By 'quickly' I mean not more than 24 hours... ");

           // session.endDialog();

            session.beginDialog("/location", { location: "repath" });              

        } else {

            var AdmibRequestID = new mongo.ObjectID(); 

                var adminGenResetRecord = {
                    'CreatedTime': LogTimeStame,
                    '_id': AdmibRequestID,
                    'Comments': results.response,
                    'RequestType':session.userData.AdminReqType + '_error_notAuthanticated'
                }    	
                
                collAdminRequests.insert(adminGenResetRecord, function(err, result){

                });  

                session.send("I'm sorry but in order to process your request, You have to be authanticated user. Let's start over... ");

                session.endDialog();

                session.beginDialog("/");                          

        }

     
    }
]);



bot.dialog('/adminReqToCallBack', [
    function (session) {

        builder.Prompts.text(session, "What is your current phone number?");

    },
    function (session, results) {

        if (session.userData.Authanticated == 'True') {

            var AdmibRequestID = new mongo.ObjectID(); 

                var adminResetToCallBackRecord = {
                    'CreatedTime': LogTimeStame,
                    'RequestByUserID': UserID,
                    '_id': AdmibRequestID,
                    'Phone': results.response,
                    'RequestType':'adminCallBack',
                    'Name':UserName,
                    'Status':'pending'
                }    	
                
                collAdminRequests.insert(adminResetToCallBackRecord, function(err, result){

                });

                session.send("OK.. ok... calm down, I will find an availble humen being and ask him to call you ASAP... ");

                session.endDialog();

                session.beginDialog("/");                 

        } else {

            var AdmibRequestID = new mongo.ObjectID(); 

                var adminResetToCallBackRecord = {
                    'CreatedTime': LogTimeStame,
                    '_id': AdmibRequestID,
                    'Comments': results.response,
                    'RequestType':'adminCallBack_error_notAuthanticated'
                }    	
                
                collAdminRequests.insert(adminResetToCallBackRecord, function(err, result){

                });            

                session.send("I'm sorry but in order to process your request, You have to be authanticated user. Let's start over... ");

                session.endDialog();

                session.beginDialog("/");

        }

     
    }
]);









bot.dialog('/GetUserList', [
    function (session) {

        session.send("[Admin mode:] These are my users:");

        var cursor = collUsers.find({"Status" : "Active"});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

               for (var i=0; i<nresultLen; i++ ) {

                   session.send(result[i].Name + ": " + result[i].Email + " | " + result[i].Org + " | " + result[i].Status );

               }

                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });      

    },
    function (session, results) {

        session.userData.GetUserList = "True";          

        session.endDialog();
            
    }
]);







bot.dialog('/CreateNewUser', [
    function (session) {

        builder.Prompts.text(session, "[Admin mode:] Let's start by Full Name:");

    },
    function (session, results) {

        session.userData.newUserName = results.response;

        builder.Prompts.text(session, "[Admin mode:] Email Address:");
            
    },
    function (session, results) {

        session.userData.newUserEmail = results.response.toLocaleLowerCase();

        builder.Prompts.text(session, "[Admin mode:] Login Password:");
            
    },
    function (session, results) {

        session.userData.newUserPassword = results.response;

        builder.Prompts.choice(session, "[Admin mode:] Profile:", ["Standard User", "Admin"]);
            
    },
    function (session, results) {

        session.userData.Profile = results.response;

        builder.Prompts.choice(session, "[Admin mode:] Org:", ["HIV.ORG.IL", "888", "Annonimouse", "Gtech"]);
            
    },
    function (session, results) {

        session.userData.newUserOrg = results.response.entity;

            var NewUserRecord = {
                'CreatedTime': LogTimeStame,
                'CreatedByUserID': UserID,
                "CreatedBy": UserName,
                "ObjectType": "UserRecord",
                'Profile': session.userData.newUserProfile,
                'Email':session.userData.newUserEmail,
                'Name':session.userData.newUserName,
                'Password':session.userData.newUserPassword,
                'Org':session.userData.newUserOrg,
                'Status':'Active'
            }    	
            
            collUsers.insert(NewUserRecord, function(err, result){

            }); 

        session.userData.newUserRecord = "True";          

        session.endDialog();

    }
]);


bot.dialog('/DefineNewOrgName', [
    function (session) {

        builder.Prompts.text(session, "[Admin mode:] Name of organization:");

    },
    function (session, results) {

        OrgName = results.response;

        OrgID = new mongo.ObjectID(); 

            var NewOrgRecord = {
                'CreatedTime': LogTimeStame,
                'CreatedByUserID': UserID,
                '_id': OrgID,
                'Type':OrgType,
                'Name':OrgName,
                'Status':'pending'
            }    	
            
            collOrgs.insert(NewOrgRecord, function(err, result){

            });


        session.endDialog();

        session.beginDialog("/AdminActions");
            
    }
]);






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


