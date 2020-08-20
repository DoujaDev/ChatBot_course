import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { 
    ComponentDialog, 
    TextPrompt,
    WaterfallDialog,
    DialogState, 
    DialogStateManager, 
    DialogSet, 
    DialogContext, 
    DialogTurnStatus, 
    WaterfallStepContext, 
    DialogTurnResult 
} from "botbuilder-dialogs";

import { FlightBookingRecognizer} from "./flightBookingRecognizer";
import { BookingDialog } from "./bookingDialog";
import { TurnContext, StatePropertyAccessor, InputHints, MessageFactory } from "botbuilder";
import { BookingDetails } from "./bookingDetails";
import { LuisRecognizer } from 'botbuilder-ai';



const MAIN_WaTERFALL_DIALOG = 'mainWatefallDialog';

export class MainDialog extends ComponentDialog{

    private luisRecognizer: FlightBookingRecognizer;
    
    constructor(luisRecognizer: FlightBookingRecognizer, bookingDialog: BookingDialog){
        super('MainDialog');

        if(!luisRecognizer){
            throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        }

        this.luisRecognizer = luisRecognizer;

        if(!bookingDialog){
            throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');
        }

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(bookingDialog)

            //A waterfall progresses from step to step in the sequence that the functions are defined in the array
            .addDialog(new WaterfallDialog(MAIN_WaTERFALL_DIALOG,[

                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WaTERFALL_DIALOG;
    }

     /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */

    public async run(context: TurnContext, dialogStateAccessor:StatePropertyAccessor<DialogState>) {
        
        const dialogSet: DialogSet = new DialogSet(dialogStateAccessor);
        dialogSet.add(this);

        //DialogContext includes the turn context, information about the dialog set, and the state of the dialog stack.
        //Use a dialog set's createContext method to create the dialog context.
        //The dialog context maintains the dialog stack and for each dialog on the stack, tracks which step is next. 
        const dialogContext: DialogContext = await dialogSet.createContext(context);

        // Use the methods of the dialog context to manage the progression of dialogs in the set.
        /**
         * Continues execution of the active dialog, if there is one, by passing this dialog
         * context to its Dialog.continueDialog method which is Called when an instance of
         * the dialog is the active dialog and a new activity is received.
         * returns Promise<DialogTurnResult> ; The status of returned object describes the 
         * status of the dialog stack after this method completes.
         */
        const result = await dialogContext.continueDialog();
        
        if(result.status === DialogTurnStatus.empty){
            await dialogContext.beginDialog(this.id);
        }
    }

     /**
         * First step in the waterfall dialog. Prompts the user for a command.
         * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
         * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
         */

         //DialogTurnResult: to indicate whether a dialog is still active after the turn has been processed by the dialog.
         private async introStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
            if(!this.luisRecognizer.isConfigured){

                const luisConfigMsg = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
                await stepContext.context.sendActivity(luisConfigMsg, null , InputHints.IgnoringInput);
                return await stepContext.next();
            }

            const messageText = (stepContext.options as any).restartMsg ? (stepContext.options as any).restartMsg : 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"';
            const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

            /**
             * This helper method formats the object to use as the options parameter, 
             * and then calls beginDialog to start the specified prompt dialog.
             * TextPrompt: dialogId
             * prompt: PromptOptions
             */
            return await stepContext.prompt('TextPrompt', {prompt: promptMessage});

        }

        /**
         * Second step in the waterall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
         * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
         */
        private async actStep(stepContext: WaterfallStepContext,) : Promise<DialogTurnResult>{

            const bookingDetails = new BookingDetails();
            if(!this.luisRecognizer.isConfigured){
                return await stepContext.beginDialog('bookingDialog', bookingDetails);
            }

            // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
            const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
            /**
             * topIntent(RecognizerResult | undefined, string, number) 
             * Returns the name of the top scoring intent from a set of LUIS results.
             * RecognizerResult: Value returned from a recognizer(LUIS)
             */
            switch(LuisRecognizer.topIntent(luisResult)){

                case 'BookFlight':
                // Extract the values for the composite entities from the LUIS result.
                const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
                const toEntities = this.luisRecognizer.getToEntities(luisResult);

                // Show a warning for Origin and Destination if we can't resolve them.
                await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);
                
                // Initialize BookingDetails with any entities we may have found in the response.
                bookingDetails.destination = toEntities.airport;
                bookingDetails.origin = fromEntities.airport;
                bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
                console.log('Luis extrected these booking details:', JSON.stringify(bookingDetails));
                
                // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
                return await stepContext.beginDialog('bookingDialog', bookingDetails);  

                default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);

            }
            return await stepContext.next();
        }

       

        /**
        * This is the final step in the main waterfall dialog.
        * It wraps up the sample "book a flight" interaction with a simple confirmation.
        */
        private async finalStep(stepContext: WaterfallStepContext,) : Promise<DialogTurnResult>{
            
            // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
            if(stepContext.result){
                const result = stepContext.result as BookingDetails;
            
            // Now we have all the booking details.

            // This is where calls to the booking AOU service or database would go.

                // If the call to the booking service was successful tell the user.
                const timeProperty = new TimexProperty(result.travelDate);
                //new Date(Date.now()): referenceDate
                const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
                const msg = `I have you booked to ${ result.destination } from ${ result.origin } on ${ travelDateMsg }.`;
                await stepContext.context.sendActivity(msg);
            }
            
            // Restart the main dialog waterfall with a different message the second time around
            return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });

        }

        /**
         * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
         * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
         * will be empty if those entity values can't be mapped to a canonical item in the Airport.
        */
        private async showWarningForUnsupportedCities(context, fromEntities, toEntities){
            const unsupportedCities = [];

            if(fromEntities.from && !fromEntities.airport ){
                unsupportedCities.push(fromEntities.from);
            }

            if(toEntities.to && !toEntities.airport){
                unsupportedCities.push(toEntities.to);
            }

            if(unsupportedCities.length){
                const messageText = `Sorry but the folling airports are not supported: ${unsupportedCities.join(', ')}`;
                await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
            }

        }
}