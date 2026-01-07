import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Send, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const SHARE_URL = "https://clickar.lovable.app/";
const SHARE_TITLE = "CLICKAR";
const SHARE_TEXT = "Conheci o CLICKAR: ferramenta de organização e controle para empresas de foto, cabine e totem em eventos.";
const SHARE_MESSAGE = `${SHARE_TEXT} Testa aqui: ${SHARE_URL}`;

interface ShareButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export function ShareButton({ 
  variant = "outline", 
  size = "default", 
  className = "",
  fullWidth = false 
}: ShareButtonProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Check for Web Share API support
    if (navigator.share) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        toast({
          title: "Compartilhado!",
          description: "Obrigado por compartilhar o CLICKAR.",
        });
      } catch (err) {
        // User cancelled or error - fallback to modal
        if ((err as Error).name !== "AbortError") {
          setShowModal(true);
        }
      }
    } else {
      // No Web Share API - show modal
      setShowModal(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_MESSAGE);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Mensagem copiada para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = () => {
    const encodedMessage = encodeURIComponent(SHARE_MESSAGE);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
    setShowModal(false);
  };

  const handleTelegram = () => {
    const encodedMessage = encodeURIComponent(SHARE_MESSAGE);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodedMessage}`, "_blank");
    setShowModal(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(SHARE_TITLE);
    const body = encodeURIComponent(SHARE_MESSAGE);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className={`gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Compartilhar CLICKAR
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Copy Link */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full justify-start gap-3 h-12"
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span>{copied ? "Copiado!" : "Copiar link"}</span>
            </Button>

            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              className="w-full justify-start gap-3 h-12 hover:bg-[#25D366]/10 hover:border-[#25D366]/50"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span>Compartilhar no WhatsApp</span>
            </Button>

            {/* Telegram */}
            <Button
              variant="outline"
              onClick={handleTelegram}
              className="w-full justify-start gap-3 h-12 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/50"
            >
              <Send className="w-5 h-5 text-[#0088cc]" />
              <span>Compartilhar no Telegram</span>
            </Button>

            {/* Email */}
            <Button
              variant="outline"
              onClick={handleEmail}
              className="w-full justify-start gap-3 h-12"
            >
              <Mail className="w-5 h-5" />
              <span>Enviar por E-mail</span>
            </Button>
          </div>

          {/* Preview Message */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">Mensagem:</p>
            <p className="text-sm text-foreground">{SHARE_MESSAGE}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
