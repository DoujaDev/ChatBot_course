
/**
 * Gathering information by posing questions is one of the main ways a bot interacts with users. The dialogs library provides
 * useful built-in features such as prompt classes that make it easy to ask questions and validate the response to make
 * sure it matches a specific data type or meets custom validation rules.
 * 
 * You can manage simple and complex conversation flows using the dialogs library. In a simple interaction, the bot runs 
 * through a fixed sequence of steps, and the conversation finishes. In general, a dialog is useful when the bot needs
 * to gather information from the user. 
 */

 /**
  * In the multi-turn prompt sample, we use a waterfall dialog, a few prompts, and a component dialog to create a simple 
  * interaction that asks the user a series of questions.
  */
const {ActivityHandler} = require('botbuilder');

class DialogBot extends ActivityHandler{
    constructor(conversationState, userState, dialog){
        super();
        if(!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if(!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if(!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogStateAccessor = conversationState.createProperty('dialogstate');

        //The onMessage method registers a listener that calls the dialog's run method to start or continue the dialog.
        this.onMessage(async (context, next)=>{

            console.log('dialogBot: Running dialog with Message Activity.');
             await this.dialog.run(context, this.dialogStateAccessor);
             console.log('****** dialogBot: activity handeled ******');
             await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context){
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.DialogBot = DialogBot;