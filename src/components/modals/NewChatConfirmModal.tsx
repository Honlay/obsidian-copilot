import { ConfirmModal } from "./ConfirmModal";
import { App } from "obsidian";

export class NewChatConfirmModal extends ConfirmModal {
  constructor(app: App, onConfirm: () => void) {
    super(app, onConfirm, "Are you sure?", "Starting a new chat will discard the current chat.");
  }
}
