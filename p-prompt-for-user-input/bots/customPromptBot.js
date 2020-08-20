/**
 * A conversation between a bot and a user often involves asking (prompting) the user for information, parsing
 * the user's response, and then acting on that information. Your bot should track the context of 
 * a conversation, so that it can manage its behavior and remember answers to previous questions. 
 * A bot's state is information it tracks to respond appropriately to incoming messages.
 */

 /**
  * A userProfile class for the user information that the bot will collect.
    A conversationFlow class to control our conversation state while gathering user information.
    An inner conversationFlow.question enumeration for tracking where we are in the conversation.
  */

  /**
   * The user state will track the user's name, age, and chosen date, and conversation state will track
   * what we've just asked the user. Since we don't plan to deploy this bot, we'll configure both 
   * user and conversation state to use memory storage.
   * 
   * We use the bot's message turn handler plus user and conversation state properties to manage the flow
   * of the conversation and the collection of input. In our bot, we'll record the state property
   * information received during each iteration of the message turn handler.
   */

const {ActivityHandler} = require('botbuilder');

//will help us to extract information from an input
const Recognizers = require('@microsoft/recognizers-text-suite');

const CONVERSATION_FLOW_PROPERTY = 'converstionFlowProperty';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

// Identifies the last question asked.
const question = {
    name: 'name',
    age: 'age',
    date: 'date',
    none: 'none'
};

class CustomPromptBot extends ActivityHandler{

    constructor(conversationState, userState){
        
        super();

        //Create property accessors for the user profile and conversation flow properties
        // The state property accessors for conversation flow and user profile.
         this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
         this.conversationFlowAccessor = conversationState.createProperty(CONVERSATION_FLOW_PROPERTY);

        //The state management objects for the conversation and user.
        this.conversationState = conversationState;
        this.userState = userState;

        this.onMessage(async (turnContext, next)=>{
            
            const flow = await  this.conversationFlowAccessor.get(turnContext,{lastQuestionAsked: question.none});
            const profile = await this.userProfileAccessor.get(turnContext, {});
            
            await CustomPromptBot.fillOutUserProfile(flow, profile, turnContext);

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
        await this.conversationState.saveChanges(turnContext, false);
        await this.userState.saveChanges(turnContext, false);
   }

   /**
    * The bot prompts the user for information, based on which question, if any, that the bot asked on the previous turn. Input is parsed using a validation method.
    * Each validation method follows a similar design:
    *   -The return value indicates whether the input is a valid answer for this question.
    *   -If validation passes, it produces a parsed and normalized value to save.
    *   -If validation fails, it produces a message with which the bot can ask for the information again.
    */

   // Manages the conversation flow for filling out the user's profile.
   static async fillOutUserProfile(flow, profile, turnContext){

        const input = turnContext.activity.text;
        let result;
        switch (flow.lastQuestionAsked) {
            // If we're just starting off, we haven't asked the user for any information yet.
            // Ask the user for their name and update the conversation flag.
            case question.none:
                await turnContext.sendActivity("Let's get started. What is your name?");
                flow.lastQuestionAsked = question.name;
                break;
            
            case question.name:
                result = this.validateName(input);
                if(result.success){
                    console.log(result.name, result.success);
                    profile.name = result.name;
                    await turnContext.sendActivity(`I have your name as ${profile.name}.`);
                    await turnContext.sendActivity("How old are you");
                    flow.lastQuestionAsked = question.age;
                    break;
                }else{
                    // If we couldn't interpret their input, ask them for it again.
                    // Don't update the conversation flag, so that we repeat this step.
                    await turnContext.sendActivity(result.menssage ||"I'm sorry, I'didn't understand that");
                    break;
                }
                

            case question.age:
                result = this.validateAge(input);
                console.log(result.age, result.success);
                if(result.success){
                    profile.age = result.age;
                    await turnContext.sendActivity(`I have your age as ${profile.age}`);
                    await turnContext.sendActivity("When is your flight?");
                    flow.lastQuestionAsked = question.date;
                    break;
                }else{
                     // If we couldn't interpret their input, ask them for it again.
                    // Don't update the conversation flag, so that we repeat this step.
                    await turnContext.sendActivity(result.menssage || "I'm sorry, I didn't understand that.");
                    break;
                }
                    
            case question.date:
                result = this.validateDate(input);
                if(result.success){
                    profile.date = result.date;
                    await turnContext.sendActivity(`Your cab ride to the airport is scheduled for  ${profile.date}`);
                    await turnContext.sendActivity('Thnanks ')
                    await turnContext.sendActivity(`Thanks for completing the booking ${ profile.name }.`);
                    flow.lastQuestionAsked = question.none;
                    profile = {};
                    break;
                }else{
                    // If we couldn't interpret their input, ask them for it again.
                    // Don't update the conversation flag, so that we repeat this step.
                    await turnContext.sendActivity(result.message || "I'm sorry, I didn't understand that.");
                    break;
                }  
        }

   }

   /**
    * The bot uses the following criteria to validate input:
    *   -The name must be a non-empty string. It's normalized by trimming white-space.
    *   -The age must be between 18 and 120. It's normalized by returning an integer.
    *   -The date must be any date or time at least an hour in the future. It's normalized by returning just the date portion of the parsed input.
    */

    // Validates name input. Returns whether validation succeeded and either the parsed and normalized
    // value or a message the bot can use to ask the user again.
    static validateName(input){

        const name = input && input.trim();
        return name !== undefined
            ? {success: true, name: name}
            : {success: false, message: 'Please enter a name that contains at least one character.'}
    }

    // Validates age input. Returns whether validation succeeded and either the parsed and normalized
    // value or a message the bot can use to ask the user again.
    static validateAge(input){

        // Try to recognize the input as a number. This works for responses such as "twelve" as well as "12".
        try {

            //Recognizers.culture.english: Use English for the Recognizers culture
          
            // Attempt to convert the Recognizer result to an integer. This works for "a dozen", "twelve", "12", and so on.
            // The recognizer returns a list of potential recognition results, if any.
            const results = Recognizers.recognizeNumber(input, Recognizers.Culture.English);
            let output;
            results.forEach(result => {

                // result.resolution is a dictionary, where the "value" entry contains the processed string; The recognized entity.
                const value = result.resolution.value;

                if (value) {

                    const age = parseInt(value);
                    if(!isNaN(age) && age >= 18 && age <= 120){
                        output = {success: true, age: age};
                        return;
                    }
                }
            });

            return output || {success: false, menssage:'Please enter an age between 18 and 120.'};
            
        } catch (error) {
            return {
                success: false,
                message: "I'm sorry, I could not interpret that as an age. Please enter an age between 18 and 120."
            };
        }
    }

   
        /**RecognizeDateTime class 
         * Recognize a date/time expression.
         * 
         * var o6 = false || 'Cat';    // f || t returns Cat
         * var o7 = 'Cat' || false;    // t || f returns Cat
         */
        
    //------------------------------------- to understand
        static validateDate(input) {
            // Try to recognize the input as a date-time. This works for responses such as "11/14/2018", "today at 9pm", "tomorrow", "Sunday at 5pm", and so on.
            // The recognizer returns a list of potential recognition results, if any.
            try {
                const results = Recognizers.recognizeDateTime(input, Recognizers.Culture.English);
                const now = new Date();
                const earliest = now.getTime() + (60 * 60 * 1000);
                let output;
                results.forEach(result => {
                    // result.resolution is a dictionary, where the "values" entry contains the processed input.
                    result.resolution.values.forEach(resolution => {
                        // The processed input contains a "value" entry if it is a date-time value, or "start" and
                        // "end" entries if it is a date-time range.
                        const datevalue = resolution.value || resolution.start;
                        // If only time is given, assume it's for today.
                        const datetime = resolution.type === 'time'
                            ? new Date(`${ now.toLocaleDateString() } ${ datevalue }`)
                            : new Date(datevalue);
                        if (datetime && earliest < datetime.getTime()) {
                            output = { success: true, date: datetime.toLocaleDateString() };
                            return;
                        }
                    });
                });
                return output || { success: false, message: "I'm sorry, please enter a date at least an hour out." };
            } catch (error) {
                return {
                    success: false,
                    message: "I'm sorry, I could not interpret that as an appropriate date. Please enter a date at least an hour out."
                };
            }
        }
}

module.exports.CustomPromptBot = CustomPromptBot;