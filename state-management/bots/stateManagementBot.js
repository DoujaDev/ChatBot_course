
const {ActivityHandler} = require('botbuilder')

// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile'

class StateManagementBot extends ActivityHandler{
   
    constructor( conversationState, userState){

        super();

        /**
         * Now we create property accessors for UserState and ConversationState. Each state property accessor
         * allows you to get or set the value of the associated state property. We use each accessor to load
         * the associated property from storage and retrieve its current state from cache.
         */

        // Create the state property accessors for the conversation data and user profile.
        //we can use those accessors at run-time to read and write state information.
        this.conversationDataAccesor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user state.

        //Reads and writes conversation state for your bot to storage.
        this.conversationState = conversationState;
        this.userState = userState;
        
        this.onMessage(async (turnContext, next)=>{

            // Get the state properties from the turn context.
            //Get():Reads a persisted property from its backing storage object.

            /** ??
             * The properties backing storage object SHOULD be loaded into memory on first access.
             * If the property does not currently exist on the storage object and a defaultValue has been specified,
             * a clone of the defaultValue SHOULD be copied to the storage object.
             * If a defaultValue has not been specified then a value of undefined SHOULD be returned.
             */

            // the second parametre is the default value
            const conversationData = await this.conversationDataAccesor.get(turnContext, { promptedForUserName: false });
            const userProfile = await this.userProfileAccessor.get(turnContext, {} );

            //If userProfile.Name is empty
            if(!userProfile.name){
                
                //if conversationData.PromptedUserForName is true
                if(conversationData.promptedForUserName){

                    //we retrieve the user name provided
                    // Set the name to what the user provided.
                    userProfile.name = turnContext.activity.text;

                    // Acknowledge that we got their name.
                    turnContext.sendActivity(`Thanks ${userProfile.name}. To see conversation data, type anything.`);

                    // Reset the flag to allow the bot to go though the cycle again.
                    conversationData.promptedForUserName = false;
                }else{

                    // Prompt the user for their name.
                    turnContext.sendActivity('What is your name?');

                    // Set the flag to true, so we don't prompt in the next turn.
                    conversationData.promptedForUserName = true;

                }
            }else{

                // Add message details to the conversation data.
                conversationData.timeStamp = turnContext.activity.timestamp.toLocaleString();
                conversationData.channelId = turnContext.activity.channelId;

                // Display state data.
                await turnContext.sendActivity(` ${ userProfile.name }, send: ${turnContext.activity.text}.`);
                await turnContext.sendActivity(`Message received at: ${conversationData.timeStamp}`);
                await turnContext.sendActivity(`Message received from: ${conversationData.channelId}`);
            }
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();

        });

        this.onMembersAdded(async (turnContext, next)=>{
            
            const membersAdded = turnContext.activity.membersAdded;
            for(let cnt =0; cnt < membersAdded.length; cnt++){
                if(membersAdded[cnt].id !== turnContext.activity.recipient.id){
                    await turnContext.sendActivity('Welcome to State Bot Sample. Type anything to get started.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(turnContext){

        await super.run(turnContext);
        // Save any state changes. The load happened during the execution of the Dialog.
        //saveChanges(): Saves the cached state object if it's been changed.
        await this.conversationState.saveChanges(turnContext, false);
        await this.userState.saveChanges(turnContext, false);
    }
  
}

module.exports.StateManagementBot = StateManagementBot;