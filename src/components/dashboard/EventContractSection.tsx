import { useState, useRef } from "react";
import { FileText, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventContract } from "@/hooks/useEventContract";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventContractSectionProps {
  eventId: string;
  contractUrl: string | null;
  onContractChange: () => void;
}

export const EventContractSection = ({
  eventId,
  contractUrl,
  onContractChange,
}: EventContractSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadContract, deleteContract, getContractUrl, getContractFileName } =
    useEventContract(eventId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadContract(file);
    if (result) {
      onContractChange();
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    if (!contractUrl) return;

    setDownloading(true);
    try {
      const signedUrl = await getContractUrl(contractUrl);
      if (signedUrl) {
        window.open(signedUrl, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!contractUrl) return;

    const success = await deleteContract(contractUrl);
    if (success) {
      onContractChange();
    }
    setShowDeleteConfirm(false);
  };

  const fileName = getContractFileName(contractUrl);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {contractUrl ? (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="flex-1 text-sm font-medium truncate" title={fileName}>
            {fileName}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              disabled={downloading}
              title="Visualizar/Baixar"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Substituir"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Anexar Contrato (PDF)
            </>
          )}
        </Button>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o contrato "{fileName}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
