import { ConfirmModal } from "./ConfirmModal";
import { App } from "obsidian";

export class RebuildIndexConfirmModal extends ConfirmModal {
  constructor(app: App, onConfirm: () => void) {
    super(
      app,
      onConfirm,
      "Rebuild Index",
      "Changing the embedding model requires rebuilding the entire vector index. This may take some time. Are you sure you want to continue?"
    );
  }
}
