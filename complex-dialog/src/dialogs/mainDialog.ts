import { BotState, TurnContext, StatePropertyAccessor } from "botbuilder";
import { ComponentDialog, WaterfallDialog, DialogSet, DialogTurnStatus, WaterfallStepContext, DialogTurnResult } from "botbuilder-dialogs";
import { TopLevelDialog, TOP_LEVEL_DIALOG } from "./topLevelDialog";

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class MainDialog extends ComponentDialog{

    private userState: BotState;
    private userProfileAccessor: StatePropertyAccessor;
    constructor(userState: BotState){

        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        this.addDialog( new TopLevelDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.finalStep.bind(this)
            ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(context, dialogStateAccessor): Promise<void> {
        
        const dialogSet = new DialogSet(dialogStateAccessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if(results.status === DialogTurnStatus.empty){

            dialogContext.beginDialog(this.id);
        }
    }

    private async initialStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{
       
        return await stepContext.beginDialog(TOP_LEVEL_DIALOG);

    }

    private async finalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult>{

        return null;
    }
}