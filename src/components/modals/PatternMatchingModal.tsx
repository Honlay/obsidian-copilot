import { App, Modal } from "obsidian";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import {
  categorizePatterns,
  getDecodedPatterns,
  createPatternSettingsValue,
} from "@/search/searchUtils";
import { File, FileText, Folder, Tag, Wrench, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagSearchModal } from "@/components/modals/TagSearchModal";
import { AddContextNoteModal } from "@/components/modals/AddContextNoteModal";
import { FolderSearchModal } from "@/components/modals/FolderSearchModal";
import { ExtensionInputModal } from "@/components/modals/ExtensionInputModal";
import { CustomPatternInputModal } from "@/components/modals/CustomPatternInputModal";
import { TruncatedText } from "@/components/TruncatedText";
import LocaleService from "@/i18n/LocaleService";

function PatternListGroup({
  title,
  patterns,
  onRemove,
}: {
  title: string;
  patterns: string[];
  onRemove: (pattern: string) => void;
}) {
  const localeService = LocaleService.getInstance();
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="font-bold">
        {localeService.getTranslation(`patternMatching.categories.${title.toLowerCase()}`)}
      </div>
      <ul className="list-disc list-inside pl-0 m-0 col-span-3 flex flex-col gap-1">
        {patterns.map((pattern) => (
          <li key={pattern} className="flex gap-2 hover:bg-dropdown-hover pl-2 pr-1 rounded-md">
            <TruncatedText className="flex-1">{pattern}</TruncatedText>
            <Button variant="ghost2" size="fit" onClick={() => onRemove(pattern)}>
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatternMatchingModalContent({
  value: initialValue,
  onUpdate,
  container,
}: {
  value: string;
  onUpdate: (value: string) => void;
  container: HTMLElement;
}) {
  const [value, setValue] = useState(initialValue);
  const patterns = getDecodedPatterns(value);
  const { tagPatterns, extensionPatterns, folderPatterns, notePatterns } =
    categorizePatterns(patterns);

  const updateCategories = (newCategories: {
    tagPatterns?: string[];
    extensionPatterns?: string[];
    folderPatterns?: string[];
    notePatterns?: string[];
  }) => {
    const newValue = createPatternSettingsValue({
      tagPatterns: newCategories.tagPatterns ?? tagPatterns,
      extensionPatterns: newCategories.extensionPatterns ?? extensionPatterns,
      folderPatterns: newCategories.folderPatterns ?? folderPatterns,
      notePatterns: newCategories.notePatterns ?? notePatterns,
    });
    setValue(newValue);
    onUpdate(newValue);
  };

  const hasValue =
    tagPatterns.length > 0 ||
    extensionPatterns.length > 0 ||
    folderPatterns.length > 0 ||
    notePatterns.length > 0;

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col gap-2 p-4 border border-border border-solid rounded-md max-h-[400px] overflow-y-auto">
        {!hasValue && (
          <div className="text-center text-sm text-muted-foreground">
            {LocaleService.getInstance().getTranslation("patternMatching.noPatterns")}
          </div>
        )}
        {tagPatterns.length > 0 && (
          <PatternListGroup
            title="tags"
            patterns={tagPatterns}
            onRemove={(pattern) => {
              const newPatterns = tagPatterns.filter((p) => p !== pattern);
              updateCategories({
                tagPatterns: newPatterns,
              });
            }}
          />
        )}
        {extensionPatterns.length > 0 && (
          <PatternListGroup
            title="extensions"
            patterns={extensionPatterns}
            onRemove={(pattern) => {
              const newPatterns = extensionPatterns.filter((p) => p !== pattern);
              updateCategories({
                extensionPatterns: newPatterns,
              });
            }}
          />
        )}
        {folderPatterns.length > 0 && (
          <PatternListGroup
            title="folders"
            patterns={folderPatterns}
            onRemove={(pattern) => {
              const newPatterns = folderPatterns.filter((p) => p !== pattern);
              updateCategories({
                folderPatterns: newPatterns,
              });
            }}
          />
        )}
        {notePatterns.length > 0 && (
          <PatternListGroup
            title="notes"
            patterns={notePatterns}
            onRemove={(pattern) => {
              const newPatterns = notePatterns.filter((p) => p !== pattern);
              updateCategories({
                notePatterns: newPatterns,
              });
            }}
          />
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              {LocaleService.getInstance().getTranslation("patternMatching.addButton")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" container={container}>
            <DropdownMenuItem
              onSelect={() => {
                new TagSearchModal(app, (tag) => {
                  const tagPattern = `#${tag}`;
                  if (tagPatterns.includes(tagPattern)) {
                    return;
                  }
                  updateCategories({
                    tagPatterns: [...tagPatterns, tagPattern],
                  });
                }).open();
              }}
            >
              <div className="flex items-center gap-2">
                <Tag className="size-4" />
                {LocaleService.getInstance().getTranslation("patternMatching.menuItems.tag")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                new FolderSearchModal(app, (folder) => {
                  if (folderPatterns.includes(folder)) {
                    return;
                  }
                  updateCategories({
                    folderPatterns: [...folderPatterns, folder],
                  });
                }).open();
              }}
            >
              <div className="flex items-center gap-2">
                <Folder className="size-4" />
                {LocaleService.getInstance().getTranslation("patternMatching.menuItems.folder")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                new AddContextNoteModal({
                  app,
                  onNoteSelect: (note) => {
                    const notePattern = `[[${note.basename}]]`;
                    if (notePatterns.includes(notePattern)) {
                      return;
                    }
                    updateCategories({
                      notePatterns: [...notePatterns, notePattern],
                    });
                  },
                  excludeNotePaths: [],
                  titleOnly: true,
                }).open();
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                {LocaleService.getInstance().getTranslation("patternMatching.menuItems.note")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                new ExtensionInputModal(app, (extension) => {
                  const extensionPattern = `*.${extension}`;
                  if (extensionPatterns.includes(extensionPattern)) {
                    return;
                  }
                  updateCategories({
                    extensionPatterns: [...extensionPatterns, extensionPattern],
                  });
                }).open();
              }}
            >
              <div className="flex items-center gap-2">
                <File className="size-4" />
                {LocaleService.getInstance().getTranslation("patternMatching.menuItems.extension")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                new CustomPatternInputModal(app, (value) => {
                  const patterns = getDecodedPatterns(value);
                  const {
                    tagPatterns: newTagPatterns,
                    extensionPatterns: newExtensionPatterns,
                    folderPatterns: newFolderPatterns,
                    notePatterns: newNotePatterns,
                  } = categorizePatterns(patterns);
                  updateCategories({
                    tagPatterns: [...tagPatterns, ...newTagPatterns],
                    extensionPatterns: [...extensionPatterns, ...newExtensionPatterns],
                    folderPatterns: [...folderPatterns, ...newFolderPatterns],
                    notePatterns: [...notePatterns, ...newNotePatterns],
                  });
                }).open();
              }}
            >
              <div className="flex items-center gap-2">
                <Wrench className="size-4" />
                {LocaleService.getInstance().getTranslation("patternMatching.menuItems.custom")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export class PatternMatchingModal extends Modal {
  private root: Root;

  constructor(
    app: App,
    private onUpdate: (value: string) => void,
    /** The raw pattern matching value, separated by commas */
    private value: string,
    title: string
  ) {
    super(app);
    // https://docs.obsidian.md/Reference/TypeScript+API/Modal/setTitle
    // @ts-ignore
    this.setTitle(title);
  }

  onOpen() {
    const { contentEl } = this;
    this.root = createRoot(contentEl);

    const handleUpdate = (value: string) => {
      this.onUpdate(value);
    };

    this.root.render(
      <PatternMatchingModalContent
        value={this.value}
        onUpdate={handleUpdate}
        container={this.contentEl}
      />
    );
  }

  onClose() {
    this.root.unmount();
  }
}
