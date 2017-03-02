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

// Initialize connection once

mongo.MongoClient.connect(connString, function(err, database) {
  if(err) throw err;
 
  dbm = database;

  collResponses = dbm.collection('Responses');
  collTickets = dbm.collection('Tickets');
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

//var bot = new builder.UniversalBot(connector, function (session) {
 //   session.send("You said: '%s'. Try asking for 'help'.", session.message.text);
//});




var UserEmail;
var UserName;
var UserOrg;
var UserID;
var TicketID;
var ResponseTimeFrameLabel;
var OrgType;
var OrgName;
var OrgID;




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

        session.sendTyping();

        session.send("Welcome to Gtech support channel, my name is SupBot and I will do my best to assist you.");

        session.sendTyping();

        session.send( "You are welcome to skip the registration process by typing 'SIGNIN' or by typing the ticketID 'ex:Sup12345' ");

        session.sendTyping();

        session.send("Let's start with a simple registration... ");

        session.sendTyping();

        builder.Prompts.text(session, "Your email is: ");

    },
    function (session, results) {

        UserEmail = results.response;

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

                                            var nresultLen = result.length;

                                            SendInfoToExistingUser(nresultLen);

                                            //return;
                                        }
                                        // do something with each doc, like push Email into a results array
                                        result.push(doc);
                                    });


                            }

                            function SendInfoToExistingUser() {

                                session.send("Good to have you back with me " + UserName + "! You have " + nresultLen + " open tickets must be resolved."); 

                                session.beginDialog("/location", { location: "path" });

                            }                            

                        }  //ghjgjgjgh
                        
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



    },    
    function (session, results) {

        UserName = results.response;
        session.userData.name = UserName;

        builder.Prompts.choice(session, "One quick question: Which of the following organizations you work for??", ["Aids Israel", "Annonimous", "888"]);
    },

    function (session, results) {

        UserOrg = results.response.entity;

        session.userData.Org = UserOrg;

        RegisterNewUser();

        function RegisterNewUser() {

            UserID = new mongo.ObjectID(); 

            var UserRecord = {
                'CreatedTime': LogTimeStame,
                '_id': UserID,
                'CreatedBy':'admin',
                'ObjectType':'UserRecord',
                'Name':UserName,
                'Email':UserEmail,
                'Org':UserOrg,
                'ObjectFormat':'txt',
                'Status':'draft'
            }    	
            
            collUsers.insert(UserRecord, function(err, result){

                session.userData.userid = UserID;

            });


            session.send("Thank you for sharing this information with me."); 

            session.beginDialog("/location", { location: "path" });

        }


        

        

    }
]).beginDialogAction('checkoutAction', 'checkoutDialog', { matches: /checkout/i });

// Dialog for checking out
    bot.dialog('checkoutDialog', function (session) {
        session.send("Got it... ");
    });





var paths = {

    "path": { 
        description: "So now, how can I help you?",
        commands: { "I have a question": "question", "I have a technical problem": "support", "I want to brainstorm with someone": "brainstorm", "Call me back ASPA": "callmeback"  }
    },

    "repath": { 
        description: "Anyhing else I can I help you with?",
        commands: { "I have another question": "question", "I have another technical problem": "support", "My tickets": "mytickets"  }
    }, 

    "reAdminAuth": { 
        description: "Woul you like try again with me?",
        commands: { "Yes": "reAdminLogin", "Reset my token": "resettoken", "Go back to my tickets": "mytickets" , "Goodbye": "bye"   }
    },    

    "question": { 
        description: "Your question is related to:",
        commands: { "an application in production": "prodapp", "an application in development": "devapp", "a new feature": "newcr"  }
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
            },                            

    "support": { 
        description: "Would you like to add another answers?",
        commands: { "yes": "pathNew_Prompts_Answers", "no": "myPaths"  }
    },

    "brainstorm": { 
        description: "Would you like to add another answers?",
        commands: { "yes": "pathNew_Prompts_Answers", "no": "myPaths"  }
    },  

    "callmeback": { 
        description: "Would you like to add another answers?",
        commands: { "yes": "pathNew_Prompts_Answers", "no": "myPaths"  }
    },      

            "tzipi51": { 
                description: "אני מדברת המון בחוגי הבית על הנושאים העכשוויים וגם קצת על ישראל ביום שאחרי",
                commands: { "רוצה לשמוע עוד": "tzipi3000", "פחות מתחבר/ת": "tzipi2000"  }
            },  

            "tzipi52": { 
                description: "ציפי לבני על פינוי עמונה: מותר לבקר פסק דין אבל אסור להפוך את בית המשפט לאויב",
                commands: { "https://www.youtube.com/watch?v=kclPkykTGsY": "tzipi521", "רוצה לשמוע עוד": "tzipi3000", "פחות מתחבר/ת": "tzipi2000"  }
            },

            "tzipi53": { 
                description: "המסר האחרון שלי היה: ראש הממשלה יודע שחוק ההסדרה רע לישראל ומתפלל שבגצ יפסול אותו",
                commands: { "https://soundcloud.com/tzipi-livni/kdirjxyipjrx": "tzipi531", "רוצה לשמוע עוד": "tzipi3000", "פחות מתחבר/ת": "tzipi2000"  }
            },            
                          

    "tzipi10": { 
        description: "תראו, אני מתכננת לגעת בכמה נושאים מורכבים כשאבחר, מה הכי מדבר אליכם?",
        commands: { "ניהול תהליך מדיני כדי לשמור על אופייה של ישראל יהודית ודמוקרטית": "tzipi1103", "שקיפות בקרן קיימת לישראל": "tzipi1103", "הנהגת סוף השבוע הארוך": "tzipi1103", "לא מתחבר/ת": "tzipi1103", "הכל": "tzipi4000"  }
    },

     "tzipi1103": { 
        description: "האמת שאני מתלבטת, רוצים לעזור לי להתמקד בעוד משהו מהותי?",
        commands: { "כן": "tzipi11031", "פחות": "tzipi2000", "בא לי להצטרף למאבק שלך": "tzipi3000", "תודה ולהתראות": "tzipi1000" }
     },    

            "tzipi11031": { 
                description: "או קיי, אז אני מתכננת להוביל את הקמת גוף נציבות הביקורת על הפרקליטות?",
                commands: { "הגיע הזמן!": "tzipi110311", "זה לא יעבוד...": "tzipi2000", "בא לי להצטרף למאבק שלך": "tzipi3000", "תודה ולהתראות": "tzipi1000" }
            },

                    "tzipi110311": { 
                        description: "וואלה? מתוך חיבור אישי?",
                        commands: { "כן": "tzipi1103111", "לא": "tzipi4000", "הסיבות שלי שמורות איתי": "tzipi4000" }
                    },
            

    "tzipi20": { 
        description: "הגיע הזמן לבנות מחנה דמוקרטי רחב שיהווה אלטרנטיבה לשלטון הימין, נכון?",
        commands: { "מדויק": "tzipi201", "רוצים להצטרף למאבק עכשיו!": "tzipi3000" }
    },


            "tzipi201": { 
                description: "כל מי שישראל היהודית, הדמוקרטית, המתונה, שמשלבת בין פעולה ביטחונית למהלך מדיני, יקרה ללבו - חייב להתאחד עכשיו.",
                commands: { "לגמרי!": "tzipi4000", "המסר הזה קצת באוויר בשבילי": "tzipi10" }
            },
            

     "tzipi1000": {
        description: "מצפה לראותך תומך בקלפי",
        commands: { "אולי...": "tzipi4000", "פחות, בהצלחה ולהתראות": "tzipi1000" }
    },    

    "tzipi2000": {
        description: "אז יאללה, נתחיל מהתחלה?",
        commands: { "כן": "tzipi0", "מעדיפים פשוט לדבר עם מישהו": "tzipi3000", "פחות, בהצלחה ולהתראות": "tzipi1000" }
    },                         

    "tzipi3000": {
        description: "מעולה! אז אשמח אם תשאירו פרטים בטופס הבא:",
        commands: { "http://lp.vp4.me/rhrt": "tzipi3001", "תודה ולהתראות": "tzipi1000" }
    }, 

    "tzipi4000": {
        description: "בא לכם לשמוע קצת יותר על הפעילות שלי??",
        commands: { "בכייף": "tzipi3000", "תודה ולהתראות": "tzipi1000" }
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

        if (destination == 'next') {

            session.replaceDialog("/location", { location: destination });

        } else if (destination == 'question') {

            session.sendTyping();

            session.send("Got it, you have question");

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

        } else if (destination == 'mytickets') {

            session.endDialog();

            session.beginDialog("/myTickets");

        } else if (destination == 'reAdminLogin') {

            session.endDialog();

            session.beginDialog("/adminAuth");

        } else if (destination == 'resettoken') {

            session.endDialog();

            session.beginDialog("/adminResetToken");

        }
        
    }
]);






bot.dialog('/getUserQuestion', [
    function (session) {

            builder.Prompts.text(session, "So... what are you waiting for? ask me anything... "); 

    },
    function (session, results) {

        if (results.response) {

            TicketID = new mongo.ObjectID(); 

            var TicketNo = Math.floor(Math.random()*90000) + 10000;

            var TicketRecord = {
                'CreatedTime': LogTimeStame,
                'UserID': UserID,
                '_id': TicketID,
                'CreatedBy':UserName,
                'CreatedByEmail':UserEmail,
                'ObjectNo':TicketNo,
                'ObjectReason':session.userData.engagementReason,
                'ObjectType':session.userData.engagementReasonAppType,
                'ObjectSevirityLevel':session.userData.engagementReasonSevirityLevel,
                'ObjectFormat':'txt',
                'ObjectTxt':results.response,
                'Status':'new'
            }    	
            
            collTickets.insert(TicketRecord, function(err, result){

            });

            session.send("Ok, now let me do some thinking about it, and I will get back to you with an answer in " + ResponseTimeFrameLabel + ", meanwhile this is your ticket number is: Sup" + TicketNo); 

            session.endDialog();

            session.beginDialog("/location", { location: "repath" });
            
        } else {
            session.send("ok");
        }
    }
]);


bot.dialog('helpDialog', function (session, args) {

    if (args.topic == 'help') {

        session.sendTyping();

        session.send("type /mtickets - to get a list of your tickets");

        session.send("type /otickets - to get a list of your tickets");

        session.send("type /logout - to end our current discussion and start a new one");

        session.send("type /restart - to restart our current discussion");

        session.send("type /admin - well...this is a restricted area and for authorized users only.");

        session.endDialog("Looking forward to your decision :)");

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


bot.dialog('restartDialog', function (session, args) {
    session.endDialog(args.topic + ": This bot will restart the session.");
}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/restart':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'recalculating' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});

bot.dialog('logoutDialog', function (session, args) {

    session.endDialog("GtechBot is logging out");

    if (args.topic == 'logout') {

        session.endConversation();

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
    session.endDialog("This function will print out the list of your tickets");

    if (args.topic == '/mtickets') {

        session.endDialog();

        session.beginDialog("/myTickets");

    }

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/mtickets':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'mytickets' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});









bot.dialog('/myTickets', [
    function (session) {

        session.send("Your tickets: ");

        var cursor = collTickets.find({"UserID": UserID});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;
            if (doc === null) {

               var nresultLen = result.length;

               for (var i=0; i<nresultLen; i++ ) {

                   session.send("results: " + result[i].ObjectTxt + " | " +  result[i].ObjectNo + " | " +  result[i].Status);

               }

                return;
            }
            // do something with each doc, like push Email into a results array
            result.push(doc);
        });        

       // builder.Prompts.choice(session, "Would you like to add another answers?", ["Yes", "Review My Paths", "No"]);

       // builder.Prompts.choice(session, "Which region would you like sales for?", salesData); 
    },
    function (session, results) {


            
    }
]);




bot.dialog('/adminAuth', [

    function (session) {

        session.sendTyping();

        session.send("Welcome to my admin mode! This is a restricted area and requires GTECH authorization to access. ");

        builder.Prompts.text(session, "Your access token:"); 

    },
    function (session, results) {

        var cursor = collUsers.find({"_id": UserID});
        var result = [];
        cursor.each(function(err, doc) {
            if(err)
                throw err;

            if (doc === null) {

               var nresultLen = result.length;

               if (results.response == result[0].Token ) {

                   session.userData.adminAuth = 'True';

                   session.send("Thank you. I was able to allocate your admin previliges. ");

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





bot.dialog('/AdminActions', [
    function (session) {

        builder.Prompts.choice(session, "Administrator functions?", ["Create New Org", "Create New User", "Open Tickets"]);

    },
    function (session, results) {

        var adminActions = results.response.entity;

        if (adminActions == 'Create New Org') {

            session.endDialog();

            session.beginDialog("/CreateNewOrg");

        } else if (adminActions == 'Create New User') {

            session.endDialog();

            session.beginDialog("/CreateNewUser");
            
        } else if (adminActions == 'Open Tickets') {

            session.endDialog();

            session.beginDialog("/opentickets");
            
        }

        session.endDialog();

        session.beginDialog("/DefineNewOrgName");
            
    }
]);

bot.dialog('/DefineNewOrgName', [
    function (session) {

        builder.Prompts.text(session, "Name of organization:");

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


