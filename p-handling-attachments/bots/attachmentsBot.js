/**
 * To continue ....
 * 15-hamdling attachments 
 */
const { ActivityHandler, ActionTypes, ActivityTypes, CardFactory } = require('botbuilder');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

class AttachmentsBot extends ActivityHandler{
    constructor(){

        super();

        this.onMembersAdded(async (context, next)=>{
            const membersAdded = context.activity.membersAdded;
            for(let cnt = 0; membersAdded.length; cnt++){
                if(membersAdded[cnt].id !== context.activity.recipient.id){

                    // If the Activity is a ConversationUpdate, send a greeting message to the user.
                    await context.sendActivity('Welcome to the Attachment Handling sample! Send me an attachment and I will save it.');
                    await context.sendActivity('Alternatively, I can send you an attachment.');
                    // Send a HeroCard with potential options for the user to select.
                    await this.displyOptions(context);

                    // By calling next() you ensure that the next BotHandler is run.
                    await next();
                }
            }
        });

        this.onMessage(async (context, next)=>{
            // Determine how the bot should process the message by checking for attachments.


        });
    }
    /**
     * 
     * Besides simple image or video attachments, you can attach a hero card, which allows you
     * to combine images and buttons in one object, and send them to the user.
     */
    async displyOptions(turnContext){
        /**
         * Defines values for ActivityTypes. Possible values include: 'message', 'contactRelationUpdate',
         * 'conversationUpdate', 'typing', 'endOfConversation', 'event', 'invoke', 'deleteUserData', 
         * 'messageUpdate', 'messageDelete', 'installationUpdate', 'messageReaction', 
         * 'suggestion', 'trace', 'handoff'
         */
        const reply = {type: ActionTypes.message};
        // Note that some channels require different values to be used in order to get buttons to display text.
        // In this code the emulator is accounted for with the 'title' parameter, but in other channels you may
        // need to provide a value for other parameters like 'text' or 'displayText'.
        const buttons = [
            //imBack: Sends a message to the bot (from the user who clicked the button or tapped the card). This message (from user to bot) is visible to all conversation participants.
            {type: ActionTypes.ImBack, title:'1.Inline Attachement', value:'1'},
            {type: ActionTypes.ImBack, title:'2.Internet Attachment', value:'2'},
            {type: ActionTypes.ImBack, title:'3.Uploaded Attachment', value:'3'},
        ]

        const card = CardFactory.heroCard('What do you want?', undefined, buttons,
        {text: 'You can upload an image or select one of the following choices.' });

        reply.attachments =[card];
        await turnContext.sendActivity(reply); 

    }
}

/**
 * An Activity is the basic communication type for the Bot Framework 
 * 
 * attachments?: Attachment[]: The Attachments property of the Activity object contains an array of Attachment objects 
 * that represent the media attachments and rich cards attached to the message.
 * To add a media attachment to a message
 * 
 * ActionType: Defines values for ActionTypes. Possible values include: 'openUrl', 'imBack', 'postBack', 'playAudio', 
 *'playVideo', 'showImage', 'downloadFile', 'signin', 'call', messageBack', 'openApp',
 * 
 * ActivityType: Defines values for ActivityTypes. Possible values include: 'message', 'contactRelationUpdate', 
 * 'conversationUpdate', 'typing', 'endOfConversation', 'event', 'invoke', 'deleteUserData', 'messageUpdate',
 * 'messageDelete', 'installationUpdate', 'messageReaction', 'suggestion', 'trace', 'handoff'
 * 
 * CardFactory: Provides methods for formatting the various card types a bot can return.
 * All of these functions return an Attachment object, which can be added to an existing activity's attachments collection 
 * directly or passed as input to one of the MessageFactory methods to generate a new activity.
 * 
 *
*/

/**Attachment interface
 * An attachment within an activity
 * -name: The name of the attachment
 * -contentType: type of the file
 * -contentUrl 
 */

module.exports.AttachmentsBot = AttachmentsBot;