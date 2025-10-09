import { t } from "i18next";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import DragAndDropDialog from "@/components/Files/DragAndDropDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import useFileUpload from "@/hooks/useFileUpload";
import {
  BACKEND_ALLOWED_EXTENSIONS,
  FileCategory,
  FileType,
  FileUploadQuestion,
} from "@/types/files/file";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { validateFields } from "@/types/questionnaire/validation";

interface FilesQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
  encounterId: string;
}

const FILE_UPLOAD_FIELDS = {
  FILE_DATA: {
    key: "file_data",
    required: true,
    validate: (value: unknown) => {
      const fileData = value as FileUploadQuestion["file_data"];
      return !!fileData;
    },
  },
  NAME: {
    key: "name",
    required: true,
    validate: (value: unknown) => {
      const name = value as FileUploadQuestion["name"];
      return !!name;
    },
  },
  ORIGINAL_NAME: {
    key: "original_name",
    required: true,
    validate: (value: unknown) => {
      const originalName = value as FileUploadQuestion["original_name"];
      return !!originalName;
    },
  },
} as const;

export function validateFileUploadQuestion(
  values: FileUploadQuestion[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    const fieldErrors = validateFields(
      {
        [FILE_UPLOAD_FIELDS.FILE_DATA.key]: value.file_data,
        [FILE_UPLOAD_FIELDS.NAME.key]: value.name,
        [FILE_UPLOAD_FIELDS.ORIGINAL_NAME.key]: value.original_name,
      },
      questionId,
      FILE_UPLOAD_FIELDS,
      index,
    );

    return [
      ...errors,
      ...fieldErrors.map((error) => ({
        ...error,
        error: (["FILE_DATA", "NAME", "ORIGINAL_NAME"] as const).some(
          (attr) => FILE_UPLOAD_FIELDS[attr].key === error.field_key,
        )
          ? t("field_required")
          : error.error,
      })),
    ];
  }, []);
}

export function FilesQuestion(props: FilesQuestionProps) {
  const { questionnaireResponse, updateQuestionnaireResponseCB, encounterId } =
    props;

  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDragDropDialog, setShowDragDropDialog] = useState(false);

  const values =
    (questionnaireResponse.values?.[0]?.value as FileUploadQuestion[]) || [];

  const handleUpdate = (
    updates: Partial<FileUploadQuestion>,
    index: number,
  ) => {
    updateQuestionnaireResponseCB(
      [
        {
          type: "files",
          value: values.map((v, i) => (i === index ? { ...v, ...updates } : v)),
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const fileUpload = useFileUpload({
    type: FileType.ENCOUNTER,
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    multiple: true,
    allowNameFallback: false,
    compress: false,
  });

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));

      const input = document.getElementById(
        "file_upload_encounter",
      ) as HTMLInputElement;
      if (input) {
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setShowDragDropDialog(false);
    }
  };

  const processedCountRef = useRef(0);
  useEffect(() => {
    if (fileUpload.files.length > processedCountRef.current) {
      setDropdownOpen(false);
      const newFiles = fileUpload.files.slice(processedCountRef.current);
      const newValues = newFiles.map((file) => ({
        name: "",
        file_data: file,
        original_name: file.name,
        file_type: FileType.ENCOUNTER,
        file_category: FileCategory.UNSPECIFIED,
        associating_id: encounterId,
      }));

      updateQuestionnaireResponseCB(
        [
          {
            type: "files",
            value: [...values, ...newValues],
          },
        ],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
      processedCountRef.current = fileUpload.files.length;
    }
  }, [
    fileUpload.files,
    values,
    encounterId,
    questionnaireResponse.question_id,
    questionnaireResponse.note,
    updateQuestionnaireResponseCB,
  ]);

  return (
    <div className="flex flex-col gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-stretch gap-2">
          <Input
            placeholder={t("file_name")}
            className="flex-1"
            value={value.name}
            onChange={(e) => handleUpdate({ name: e.target.value }, index)}
          />
          <div className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-2 max-w-[150px]">
            <span className="text-sm truncate">{value.original_name}</span>
          </div>
          <Button
            variant={"outline"}
            className="border border-secondary-300"
            onClick={() => {
              fileUpload.removeFile(index);
              updateQuestionnaireResponseCB(
                [
                  {
                    type: "files",
                    value: values.filter((_, i) => i !== index),
                  },
                ],
                questionnaireResponse.question_id,
                questionnaireResponse.note,
              );
            }}
          >
            <CareIcon icon="l-trash" className="size-4" />
          </Button>
        </div>
      ))}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant={"secondary"} className="border border-secondary-300">
            <CareIcon icon="l-file-upload-alt" />
            {t("add_files")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-2.5rem)] sm:w-full"
        >
          <DropdownMenuItem
            className="flex items-center text-primary-900 font-medium"
            onSelect={(e) => {
              e.preventDefault();
              setShowDragDropDialog(true);
            }}
          >
            <CareIcon icon="l-file-upload-alt" />
            <span>{t("choose_file")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              fileUpload.handleCameraCapture();
              setDropdownOpen(false);
            }}
            className="flex items-center text-primary-900 font-medium"
            aria-label={t("open_camera")}
          >
            <CareIcon icon="l-camera" />
            <span>{t("open_camera")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              fileUpload.handleAudioCapture();
              setDropdownOpen(false);
            }}
            className="flex items-center text-primary-900 font-medium"
            aria-label={t("record")}
          >
            <CareIcon icon="l-microphone" />
            <span>{t("record")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DragAndDropDialog
        open={showDragDropDialog}
        onOpenChange={setShowDragDropDialog}
        onUpload={handleFileUpload}
      />
      {fileUpload.Input({ className: "hidden" })}
      {fileUpload.Dialogues}
    </div>
  );
}
