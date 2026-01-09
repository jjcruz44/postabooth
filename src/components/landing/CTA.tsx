import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Background glow */}
          <div className="absolute inset-0 gradient-primary rounded-3xl opacity-10 blur-xl" />
          
          {/* Card */}
          <div className="relative gradient-primary rounded-3xl p-8 md:p-12 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm text-primary-foreground font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>Comece hoje mesmo</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4"
              >
                Chega de improvisar seu marketing
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8"
              >
                Tenha clareza sobre o que postar, quando postar e por que postar. 
                Seu marketing organizado a partir de agora.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="xl"
                  variant="outline"
                  className="!bg-white !text-primary border-0 hover:!bg-white/90 shadow-elevated group"
                >
                  Criar minha conta grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
