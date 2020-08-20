
/**
 * Whenever a new user is connected, they are provided with a welcomeMessage, infoMessage, and
 *  patternMessage by the bot. When a new user input is received, welcomedUserProperty
 *  is checked to see if didBotWelcomeUser is set to true. If not, an initial welcome 
 * user message is returned to the user. If DidBotWelcomeUser is true, the user's
 *  input is evaluated. Based on the content of the user's input this bot will
 *  do one of the following:
 *  -Echo back a greeting received from the user.
 *  -Display a hero card providing addition information about bots
 *  -Resend the WelcomeMessage explaining expected inputs for this bot.
 */

 /**Welcome new user and discard initial input
  * It is also important to consider when your user’s input might actually contain useful information, and this may vary for 
  * each channel. To ensure your user has a good experience on all possible channels, we check the didBotWelcomedUser 
  * property, if it does not exist, we set it to "false" and do not process the initial user input. We instead 
  * provide the user with an initial welcome message. The bool didBotWelcomeUser is then set to "true" and 
  * our code processes the user input from all additional message activities.
  */
const { ActivityHandler, CardFactory, ActionTypes } = require("botbuilder");

const WELCOMED_USER = 'welcomedUserProperty'

class WelcomeBot extends ActivityHandler{
    /**
     *
     * @param {UserState} User state to persist boolean flag to indicate
     *                    if the bot had already welcomed the user
     */

    constructor(userState){
        super();

        this.userState = userState;
        //create a property accessor that provides us a handle to welcomedUserProperty which is persisted within userState.
        this.welcomedUserpropertyAccessor = this.userState.createProperty(WELCOMED_USER);

       

        //Welcome new user and discard initial input
        this.onMessage(async (context, next) => {
            // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user) set the default to false.
            const didBotWelcomedUser = await this.welcomedUserpropertyAccessor.get(context, false);
            if(didBotWelcomedUser === false){
                // The channel should send the user name in the 'From' object
                // TurnContext.Activity.from : Identifies the sender of the message.
                const userName = context.activity.from.name;
           
                await context.sendActivity('You are seeing this message because this was your first message ever sent to this bot.');
                await context.sendActivity(`It is a good practice to welcome the user and provide personal greeting. For example, welcome ${ userName }.`);

                // Set the flag indicating the bot handled the user's first message.
                await this.welcomedUserpropertyAccessor.set(context, true);

            /**
             * Once a new user has been welcomed, user input information is evaluated for each message turn
             * and the bot provides a response based on the contextof that user input. The following 
             * code shows the decision logic used to generate that response
             *  */ 
            }else{

                // This example uses an exact match on user's input utterance.
                // Consider using LUIS or QnA for Natural Language Processing.
                const text = context.activity.text.toLowerCase();
                
                switch (text) {
                    case 'hello':
                    case 'hi':
                        await context.sendActivity(`Yo said: ${context.activity.text}` );
                        break;
                
                    case 'intro':
                    case 'help':
                        //An input of 'intro' or 'help' uses CardFactory to present the user with an Intro Adaptive Card.
                        await this.sendIntroCard(context);
                        break;
                    default:
                        await context.sendActivity(`This is a simple Welcome Bot sample. You can say 'intro' to
                                                    see the introduction card. If you are running this bot in the Bot
                                                    Framework Emulator, press the 'Start Over' button to simulate user joining a bot or a channel`);                            
                }

            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        /**Detect and greet newly connected users
         * This JavaScript code sends initial welcome messages when a user is added. This is done by checking the conversation
         * activity and verifying that a new member was added to the conversation.
         */
        this.onMembersAdded(async (context, next) => {
        // Sends welcome messages to conversation members when they join the conversation.
        // Messages are only sent to conversation members who aren't the bot.
        
        // Iterate over all new members added to the conversation
        for(const idx in context.activity.membersAdded){
            
            // Greet anyone that was not the target (recipient) of this message.
            // Since the bot is the recipient for events from the channel,
            // context.activity.membersAdded === context.activity.recipient.Id indicates the
            // bot was added to the conversation, and the opposite indicates this is a user.
            if(context.activity.membersAdded[idx].id !== context.activity.recipient.id){
                await context.sendActivity('Welcome to the \'Welcome User\' Bot. This bot will introduce you to welcoming and greeting users.');
                await context.sendActivity("You are seeing this message because the bot received at least one 'ConversationUpdate' " +
                    'event, indicating you (and possibly others) joined the conversation. If you are using the emulator, ' +
                    'pressing the \'Start Over\' button to trigger this event again. The specifics of the \'ConversationUpdate\' ' +
                    'event depends on the channel. You can read more information at https://aka.ms/about-botframework-welcome-user');
                await context.sendActivity('It is a good pattern to use this event to send general greeting to user, explaining what your bot can do. ' +
                    'In this example, the bot handles \'hello\', \'hi\', \'help\' and \'intro\'. ' +
                    'Try it now, type \'hi\'');
            }
         }

         // By calling next() you ensure that the next BotHandler is run.
         await next();

        });

    }

    /**
    *  Override the ActivityHandler.run() method to save state changes after the bot logic completes.
    */
    async run(context){
        await super.run(context);

        // Save state changes
        await this.userState.saveChanges(context);
    }
    
    //Using hero card greeting
    async sendIntroCard(context){
        // CardeFactory.heroCard(): Returns an attachment for a hero card.
        const card = CardFactory.heroCard(
            'Welcome to Bot Framework!',
            'Welcome to Welcome Users bot sample! This Introduction card is a great way to introduce your Bot to the user and suggest some things to get them started. We use this opportunity to recommend a few next steps for learning more creating and deploying bots.',
            ['https://aka.ms/bf-welcome-card-image'],
            [
                {
                    //Opens a URL in the default browser.
                    type: ActionTypes.OpenUrl,
                    title: 'Get an overview',
                    value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Ask a question',
                    value: 'https://stackoverflow.com/questions/tagged/botframework'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Learn how to deploy',
                    value: 'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0'
                }
            ]
        );
        await context.sendActivity({ attachments: [card] });
    }
}

module.exports.WelcomeBot = WelcomeBot;