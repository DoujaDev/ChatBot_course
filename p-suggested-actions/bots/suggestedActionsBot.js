const { ActivityHandler, MessageFactory } = require('botbuilder');
class SuggestedActionsBot extends ActivityHandler{

    constructor(){
        super();

        this.onMembersAdded(async (context,next)=>{
            await this.sendWelcomeMessage(context);
            console.log();
            await next();
        });
    }

     /**
     * Send a welcome message along with suggested actions for the user to click.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendWelcomeMessage(turnContext){
        const {activity} = turnContext;

        // Iterate over all new members added to the conversation.
        for(const idx in activity.membersAdded){
            if(activity.membersAdded[idx].id !== activity.recipient.id ){
                const welcomeMessage = `Welcome to suggestedActionsBot ${ activity.membersAdded[idx].name }. ` +
                'This bot will introduce you to Suggested Actions. ' +
                'Please select an option:';
                turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
                
            }
        }

    }

    /**
     * Send suggested actions to the user.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
    */
    async sendSuggestedActions(turnContext){
        /**MessageFactory class
         * 
         * A set of utility functions to assist with the formatting of the various message types a bot can return.
         * suggestedActions(actions: string | CardAction[], text?: string, speak?: string, inputHint?: InputHints | string)
         * Returns a message that includes a set of suggested actions and optional text.
         * -actions;: Array of card actions or strings to include. Strings will be converted to messageBack actions.
         * -text: (Optional) text of the message.
         */

         /**
         * SuggestedActions that can be performed
         * -actions: CardAction[] -> Actions that can be shown to the user
         *  -CardAction: A clickable action
         */
        const reply = MessageFactory.suggestedActions(['Green', 'Yellow', 'Pink'], 'What is the best color? ');
        await turnContext.sendActivity(reply);

    }

}

module.exports.SuggestedActionsBot = SuggestedActionsBot;