import { ComponentDialog, TextPrompt, NumberPrompt, WaterfallDialog, WaterfallStepContext, DialogTurnResult } from "botbuilder-dialogs";
import { ReviewSelectionDialog } from "./reviewSelectionDialog";
import { UserProfile } from "../../userProfile";

export const TOP_LEVEL_DIALOG = 'TOP_LEVEL_DIALOG';

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_INFO = 'userInfo'

export class TopLevelDialog extends ComponentDialog{
    constructor(){

        super(TOP_LEVEL_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT))
            .addDialog(new ReviewSelectionDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

                this.nameStep.bind(this),
                this.ageStep.bind(this),
                this.startSelectionStep.bind(this),
                this.acknowledgementStep.bind(this)

            ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async nameStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{

        // Create an object in which to collect the user's information within the dialog.
        stepContext.values[USER_INFO] = new UserProfile();

        const promptOptions = {prompt: 'Please enter your name.'};

        // Ask the user to enter their name.
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    private async ageStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
       
        // Set the user's name to what they entered in response to the name prompt.
        stepContext.values[USER_INFO].name = stepContext.result;

        const promptOptions = {prompt: 'Please enter your age.' };
        
        // Ask the user to enter their age.
        return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
    }

    private async startSelectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
        return null;
    }

    private async acknowledgementStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
        return null;
    }
}