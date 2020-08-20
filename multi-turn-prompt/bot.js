// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Ha dicho: ${ context.activity.text }`;
            
            /** MessageFactory
             * A set of utility functions to assist with the formatting of the various message types a bot can return.
             * 
             * function text(text: string, speak?: string, inputHint?: InputHints | string)
             * Returns a simple text message.
             * -text: Text to include in the message.
             * -apek: SSML to include in the message.
             * inputHint: input hint for the message. Defaults to acceptingInput.
             */
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
        /**
         * ActivityHandler.onMembersAdded(handler: BotHandler)
         * Registers an activity event handler for the members added event, emitted 
         * for any incoming conversation update activity that includes members 
         * added to the conversation.
         * -handler: The event handler.
         */
        this.onMembersAdded(async (context, next) => {

            /** TurnContext.Activity.membersAdded
             * 
             * The activity's membersAdded property contains the members added to the conversation,
             * which can include the bot.
             * -context: TurnContext
             * -activity:Activity -> Gets the activity associated with this turn.
             * -membersAdded -> The collection of members added to the conversation.
             */
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hola, es mi primera experiencia! Repito lo que dices';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                //TurnContext.Activity.recepient: Identifies the recipient of the message.
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
