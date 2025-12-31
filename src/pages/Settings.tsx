import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, User, Bell, Palette, Shield, CreditCard, HelpCircle, Save, Loader2, Link2, ExternalLink, CheckCircle, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    brandStyle: "",
    zapierWebhookUrl: "",
  });

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        city: profile.city || "",
        brandStyle: profile.brandStyle || "",
        zapierWebhookUrl: profile.zapierWebhookUrl || "",
      });
    }
  }, [profile]);

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "integracoes", label: "Integrações", icon: Link2 },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "privacidade", label: "Privacidade", icon: Shield },
    { id: "assinatura", label: "Assinatura", icon: CreditCard },
    { id: "ajuda", label: "Ajuda", icon: HelpCircle },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        city: formData.city,
        brandStyle: formData.brandStyle,
        zapierWebhookUrl: formData.zapierWebhookUrl,
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

              {activeTab === "integracoes" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Integrações</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure suas integrações para publicação automática
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Zapier + Buffer</h3>
                          <p className="text-xs text-muted-foreground">
                            Publique automaticamente no Instagram e Facebook
                          </p>
                        </div>
                        {formData.zapierWebhookUrl ? (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500 ml-auto" />
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            URL do Webhook Zapier
                          </label>
                          <input
                            type="url"
                            value={formData.zapierWebhookUrl}
                            onChange={(e) => setFormData({ ...formData, zapierWebhookUrl: e.target.value })}
                            placeholder="https://hooks.zapier.com/hooks/catch/..."
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary font-mono text-sm"
                          />
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-2">
                          <p className="font-medium text-foreground">Como configurar:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Crie um Zap no Zapier com trigger "Webhooks by Zapier"</li>
                            <li>Escolha "Catch Hook" e copie a URL gerada</li>
                            <li>Adicione ação "Buffer" para agendar posts</li>
                            <li>Mapeie os campos: content, scheduled_time, image_url</li>
                          </ol>
                          <a 
                            href="https://zapier.com/apps/buffer/integrations/webhooks" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                          >
                            Ver tutorial no Zapier <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar webhook
                  </Button>
                </div>
              )}

              {activeTab === "notificacoes" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Notificações</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure como deseja receber notificações
                    </p>
                  </div>
                  <p className="text-muted-foreground text-center py-8">
                    Configurações de notificações em breve
                  </p>
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
