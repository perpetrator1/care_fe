import CareIcon from "@/CAREUI/icons/CareIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useDragAndDrop from "@/hooks/useDragAndDrop";
import { cn } from "@/lib/utils";
import { BACKEND_ALLOWED_EXTENSIONS } from "@/types/files/file";
import { t } from "i18next";
import { useState } from "react";

interface DragAndDropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
}

const DragAndDropDialog = ({
  open,
  onOpenChange,
  onUpload,
}: DragAndDropDialogProps) => {
  const { dragOver, onDragOver, onDragLeave } = useDragAndDrop();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedFiles([]);
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="md:max-w-4xl max-h-screen overflow-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">{t("upload_files")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("drag_and_drop_or_click_to_select")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors min-h-[300px] flex items-center justify-center",
              dragOver
                ? "border-primary bg-primary/10"
                : "border-gray-200 hover:border-gray-300",
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={async (e) => {
              e.preventDefault();
              onDragLeave();
              const newFiles = Array.from(e.dataTransfer.files);
              if (newFiles.length > 0) {
                setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
              }
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = BACKEND_ALLOWED_EXTENSIONS.map(
                (ext) => `.${ext}`,
              ).join(",");
              input.onchange = async (e) => {
                const newFiles = (e.target as HTMLInputElement).files;
                if (newFiles) {
                  setSelectedFiles((prevFiles) => [
                    ...prevFiles,
                    ...Array.from(newFiles),
                  ]);
                }
              };
              input.click();
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <CareIcon
                icon="l-cloud-upload"
                className="size-12 text-gray-400"
              />
              <p className="text-sm text-gray-500 select-none">
                {dragOver
                  ? t("drop_file_here")
                  : t("drag_and_drop_or_click_to_select")}
              </p>
              <p className="text-xs text-gray-400 select-none">
                {t("supported_formats")}:{" "}
                {BACKEND_ALLOWED_EXTENSIONS.join(", ")}
              </p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto p-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CareIcon
                      icon="l-file"
                      className="size-4 text-gray-400 flex-shrink-0"
                    />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => {
                      setSelectedFiles((prevFiles) =>
                        prevFiles.filter((_, i) => i !== index),
                      );
                    }}
                  >
                    <CareIcon icon="l-times" className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
            {t("upload")} ({selectedFiles.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DragAndDropDialog;
