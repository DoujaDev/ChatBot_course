
/**
 * Typically, each message that a bot sends to the user directly relates to the user's prior input. In some cases,
 * a bot may need to send the user a message that is not directly related to the current topic of conversation 
 * or to the last message the user sent. These types of messages are called proactive messages.
 */

 /**
  * The conversation reference has a conversation (conversation) property that describes the conversation in which the activity exists.
  * The conversation has a user (user) property that lists the users participating in the conversation, and a service
  * URL (serviceUrl) property that channels use to denote the URL where replies to the current activity may be sent.
  * A valid conversation reference is needed to send proactive messages to users.
  */

/** Send proactive message
 * The second controller, the notify controller, is responsible for sending the proactive message to the bot. Use the following steps to generate a proactive message.
 *  -Retrieve the reference for the conversation to which to send the proactive message.
 *  -Call the adapter's continue conversation method, providing the conversation reference and the turn handler delegate to use. The continue conversation method generates a turn context for the referenced conversation and then calls the specified turn handler delegate.
 *  -In the delegate, use the turn context to send the proactive message.
 */
const {ActivityHandler, TurnContext} = require('botbuilder');
class ProactiveBot extends ActivityHandler{
    /**
     * 
     * @param {An object relating to a particular point in a conversation} conversationReferences 
     */
    constructor(conversationReferences){
        super();

        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences = conversationReferences;
        /**
         * onConversationUpdate(handler: BotHandler)
         * Registers an activity event handler for the conversation update event, 
         * emitted for every incoming conversation update activity.
         *  -handler: The event handler.
         * Conversation update activities describe a changes to a conversation's metadata, such as 
         * title, participants, or other channel-specific information.
         */
        this.onConversationUpdate(async (context, next) => {
            this.addConversationReferences(context.activity);
            await next(); 
        });

       this.onMembersAdded(async (context, next) => {
           for(const idx in context.activity.membersAdded){
               if(context.activity.membersAdded[idx].id !== context.activity.recipient.id){
                const welcomeMessage = 'Welcome to the Proactive Bot sample.  Navigate to http://localhost:3978/api/notify to proactively message everyone who has previously messaged this bot.';
                await context.sendActivity(welcomeMessage);
               }
           }

           // By calling next() you ensure that the next BotHandler is run.
           await next();
       });

        this.onMessage(async (context, next) =>{
            // Echo back what the user said
            await context.sendActivity(`You said: ${context.activity.text}`);
            await next();
        });
    }

    addConversationReferences(activity){
        /**
         * getConversationReference(activity: Partial<Activity>)
         * Copies conversation reference information from an activity.
         * -activity: The activity to get the information from.
         * You can save the conversation reference as a JSON object and use it later to proactively message the user.
         */

         /**
          * conversationReference: An object relating to a particular point in a conversation
          * converstion:Conversation reference
          * id:Channel id for the user or bot on this channel 
          */
        const conversationReference = TurnContext.getConversationReference(activity);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }

}

module.exports.ProactiveBot = ProactiveBot;