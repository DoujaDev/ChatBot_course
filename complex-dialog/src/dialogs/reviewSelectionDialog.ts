import { ComponentDialog } from "botbuilder-dialogs";

export const REVIEW_SELECTION_DIALOG = 'REVIEW_SELECTION_DIALOG';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

export class ReviewSelectionDialog extends ComponentDialog{

    constructor(){
        super(REVIEW_SELECTION_DIALOG);

        
    }

}