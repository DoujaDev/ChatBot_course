import { ActivityHandler, BotState, StatePropertyAccessor, UserState, ConversationState } from "botbuilder";
import { Dialog, DialogState, ThisMemoryScope } from "botbuilder-dialogs";
import { MainDialog } from "../dialogs/mainDialog";
import { threadId } from "worker_threads";

export class DialogBot extends ActivityHandler{
    private conversationState: BotState;
    private userState: BotState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;

    constructor(conversationState:BotState, userState: BotState, dialog:Dialog){

        super();
        
        if(!conversationState){
            throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        }
                
        if(!userState){
            throw new Error('[DialogBot]: Missing parameter. userState  is required');
        }
                
        if(!dialog){
            throw new Error('[DialogBot]: Missing parameter. dialog is required');
        }

        this.conversationState = conversationState as ConversationState;
        this.userState = userState as UserState;
        this.dialog = dialog; 
        this.dialogState = conversationState.createProperty<DialogState>('DialogState');

        this.onMessage(async (context, next) =>{

            console.log('Running dialog with message Activity');

            await(this.dialog as MainDialog).run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */

     async run(context): Promise<void>{

        await super.run(context )

        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
     }


}