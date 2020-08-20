import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';

import { CancelAndHelpDialog } from "./cancelAndHelpDialog";

import { 
    TextPrompt,
    ConfirmPrompt, 
    WaterfallDialog,
    WaterfallStepContext,
    DialogTurnResult 
} from "botbuilder-dialogs";

import { DateResolverDialog } from "./dateResolverDialog";
import { BookingDetails } from "./bookingDetails";
import { MessageFactory, InputHints } from "botbuilder";

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateresolverDialog'; 
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

export class BookingDialog extends CancelAndHelpDialog {

    constructor(id: string){
        super(id || 'bookingDialog' );

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.destinationStep.bind(this),
                this.originStep.bind(this),
                this.travelDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    private async destinationStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
        
        //stepContext.options: Any options passed to the steps waterfall dialog when it was started with DialogContext.beginDialog().
        const bookingDetails =  stepContext.options  as BookingDetails;

        if(!bookingDetails.destination){

            const msgText = 'To what city would you like to travel?';
            const msg = MessageFactory.text(msgText, msgText, InputHints.ExpectingInput);
            
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });

        }else{
            return await stepContext.next(bookingDetails.destination);
        }
      
    }

    private async originStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{

        const bookingDetails= stepContext.options as BookingDetails;

        // Capture the response to the previous step's prompt
        bookingDetails.destination = stepContext.result;

        if(!bookingDetails.origin){
            const msgText = 'From what city will you be travelling?';
            const msg = MessageFactory.text(msgText, msgText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }else{

            return await stepContext.next(bookingDetails.origin);
        }

    }

    /**
     * If an origin city has not been provided, prompt for one.
     */
    private async travelDateStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{

        const bookingDetails = stepContext.options as BookingDetails;

        bookingDetails.origin = stepContext.result;

        if(!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)){
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, {date: bookingDetails.travelDate });
        }else{
            return await stepContext.next(bookingDetails.travelDate);
        }
    }

    /**
     * Confirm the information the user has provided.
     */
    private async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
        const bookingDetails = stepContext.options as BookingDetails;
        bookingDetails.travelDate = stepContext.result;
        const messageText = `Please confirm, I have you traveling to: ${ bookingDetails.destination } from: ${ bookingDetails.origin } on: ${ bookingDetails.travelDate }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, {prompt: msg});
    }

    /**
     * Complete the interaction and end the dialog.
     */
    private async finalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
        if(stepContext.result === true){
            
            const bookingDetails = stepContext.options as BookingDetails;
            return await stepContext.endDialog(bookingDetails);

        }else{
            return await stepContext.endDialog();
        }
    }

    private isAmbiguous(timex:string){
        const timexProperty = new TimexProperty(timex);
        return !timexProperty.types.has('definite');
    }


}