import { LuisRecognizer, LuisApplication, LuisRecognizerOptionsV3 } from "botbuilder-ai";
import { Configurable } from "botbuilder-dialogs";
import { TurnContext, RecognizerResult } from "botbuilder";

export class FlightBookingRecognizer{

    /**LuisRecognizer
     * Recognize intents in a user utterance using a configured LUIS model.
     * This class is used to recognize intents and extract entities from incoming messages. 
     * LuisRecognizer(application: LuisApplication | string, options?: LuisRecognizerOptionsV3 | LuisRecognizerOptionsV2)
     */
    private recognizer: LuisRecognizer;

    constructor(config: LuisApplication){
        
        /**LuisApplication
         * Description of a LUIS application used for initializing a LuisRecognizer.
         * -applicationId: Your models application Id from LUIS
         * -endpoint: LUIS endpoint 
         * -endpointKey: Endpoint key for talking to LUIS
         */
        const luisIsConfigured = config && config.applicationId && config.endpoint && config.endpointKey;
            if(luisIsConfigured){
            // Set the recognizer options depending on which endpoint version you want to use e.g LuisRecognizerOptionsV2 or LuisRecognizerOptionsV3.
            const recognizerOptions: LuisRecognizerOptionsV3 = {
                apiVersion : 'v3'
            };
        
            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    public get isConfigured() : boolean{
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    public async executeLuisQuery(context: TurnContext): Promise<RecognizerResult>{
        //recognize():Calls LUIS to recognize intents and entities in a users utterance.
        //context:Context for the current turn of conversation with the use.
        //recognize() returns Promise<RecognizerResult>
        return this.recognizer.recognize(context);
        /**
         * RecognizerResult interface
         * alteredText:If original text is changed by things like spelling, the altered version.
         * entities:entities recognized.
         * intents:Intents recognized for the utterance.
         * text:Utterance sent to recognizer
         */
    }

    public getFromEntities(result){

        let fromValue, fromAirportValue;
        if(result.entities.$instance.From){
            fromValue = result.entities.$instance.From[0].text;
            console.log('fromValue: ', fromValue);
        }

        if( fromValue && result.entities.From[0].Airport){
            fromAirportValue = result.entities.From[0].Airport[0][0];
        }

        return {from: fromValue, airport: fromAirportValue};
    }

    public getToEntities(result){

        let toValue, toAirportValue;

        if(result.entities.$instance.To){
            toValue = result.entities.$instance.To[0].text;
        }

        if(toValue && result.entities.To[0].Airport){
            toAirportValue = result.entities.To[0].Airport[0][0];
        }

        return {to: toValue, airport: toAirportValue}
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    public getTravelDate(result){
        const datetimeEntity = result.entities.datetime;
        if(!datetimeEntity || !datetimeEntity[0].timex) return undefined;

        const timex = datetimeEntity[0].timex;
        if(!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}