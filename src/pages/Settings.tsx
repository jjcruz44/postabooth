import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, User, Palette, Shield, CreditCard, HelpCircle, Save, Loader2,
  Building2, Upload, Trash2, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useLogoUpload } from "@/hooks/useLogoUpload";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile, refetch } = useProfile();
  const { uploadLogo, removeLogo, uploading } = useLogoUpload();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("marca");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    brandStyle: "",
  });

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        city: profile.city || "",
        brandStyle: profile.brandStyle || "",
      });
    }
  }, [profile]);

  const tabs = [
    { id: "marca", label: "Marca", icon: Building2 },
    { id: "perfil", label: "Perfil", icon: User },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "privacidade", label: "Privacidade", icon: Shield },
    { id: "assinatura", label: "Assinatura", icon: CreditCard },
    { id: "ajuda", label: "Ajuda", icon: HelpCircle },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newLogoUrl = await uploadLogo(file);
    if (newLogoUrl) {
      await refetch();
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    const success = await removeLogo(profile?.logoUrl);
    if (success) {
      await refetch();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        city: formData.city,
        brandStyle: formData.brandStyle,
      });
      toast({
        title: "Configurações salvas!",
        description: "Suas alterações foram aplicadas com sucesso.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="md:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              {activeTab === "marca" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Marca</h2>
                    <p className="text-sm text-muted-foreground">
                      Personalize a identidade visual da sua marca
                    </p>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-foreground">
                      Logo da empresa
                    </label>
                    
                    <div className="flex items-start gap-6">
                      {/* Logo Preview */}
                      <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                        {profile?.logoUrl ? (
                          <img 
                            src={profile.logoUrl} 
                            alt="Logo da empresa" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="gap-2"
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {profile?.logoUrl ? "Alterar logo" : "Fazer upload"}
                        </Button>

                        {profile?.logoUrl && (
                          <Button
                            variant="ghost"
                            onClick={handleRemoveLogo}
                            disabled={uploading}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remover logo
                          </Button>
                        )}

                        <p className="text-xs text-muted-foreground">
                          PNG, JPG ou WebP. Máximo 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Style */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Estilo da marca
                    </label>
                    <textarea
                      value={formData.brandStyle}
                      onChange={(e) => setFormData({ ...formData, brandStyle: e.target.value })}
                      placeholder="Descreva o tom de voz e estilo da sua marca..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Esse estilo será usado para personalizar o conteúdo gerado pela IA
                    </p>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar alterações
                  </Button>
                </div>
              )}

              {activeTab === "perfil" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Perfil</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie suas informações pessoais
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Seu nome"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Sua cidade"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar alterações
                  </Button>
                </div>
              )}

              {activeTab === "aparencia" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Aparência</h2>
                    <p className="text-sm text-muted-foreground">
                      Personalize a aparência do aplicativo
                    </p>
                  </div>
                  <p className="text-muted-foreground text-center py-8">
                    Configurações de aparência em breve
                  </p>
                </div>
              )}

              {activeTab === "privacidade" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Privacidade</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie suas configurações de privacidade
                    </p>
                  </div>
                  <p className="text-muted-foreground text-center py-8">
                    Configurações de privacidade em breve
                  </p>
                </div>
              )}

              {activeTab === "assinatura" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Assinatura</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie seu plano e pagamentos
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="font-medium text-foreground">Plano Gratuito</p>
                    <p className="text-sm text-muted-foreground">
                      Você está no plano gratuito com funcionalidades limitadas
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "ajuda" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Ajuda</h2>
                    <p className="text-sm text-muted-foreground">
                      Precisa de ajuda? Entre em contato
                    </p>
                  </div>
                  <div className="space-y-3">
                    <a
                      href="mailto:suporte@postabooth.com"
                      className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground">Email de suporte</p>
                      <p className="text-sm text-muted-foreground">suporte@postabooth.com</p>
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
