import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Stethoscope, Camera, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                <ShieldCheck className="w-4 h-4" />
                The Universal Pet Identity Standard
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
                Protect your best friend with <span className="text-gradient">verified identity.</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                PetRegistry creates a secure, vet-verified digital passport for your pet. Instantly access vaccination records, medical history, and ownership proof anywhere, anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all">
                    Register Your Pet
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-xl border-2 hover:bg-secondary transition-all">
                    <Search className="w-5 h-5 mr-2" />
                    Verify a Pet
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckIcon /> Trusted by Vets
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon /> Global Access
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon /> Bank-grade Security
                </div>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border border-white/50 aspect-square lg:aspect-[4/3] max-w-xl">
                <img
                  src={`${import.meta.env.BASE_URL}images/hero-pets.png`}
                  alt="Happy Golden Retriever"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />

                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 glass-panel rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Status: Verified</p>
                    <p className="text-xs text-muted-foreground">Rabies up to date</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Simple, secure, and universal</h2>
            <p className="text-lg text-muted-foreground">Three steps to give your pet a permanent digital identity that protects them for life.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Camera}
              step="01"
              title="Register & Profile"
              desc="Create an account with your pet's photo, breed, and your contact information."
            />
            <FeatureCard
              icon={Stethoscope}
              step="02"
              title="Vet Verification"
              desc="Your veterinarian logs in to confirm medical records and issue a Verified badge."
            />
            <FeatureCard
              icon={Search}
              step="03"
              title="Instant Lookup"
              desc="Anyone can scan or search the Pet ID to verify ownership and health status."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-display font-bold mb-6">Are you a Veterinarian?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join our network to issue official vaccination records and help reunite lost pets with their families faster.
          </p>
          <Link href="/vet">
            <Button size="lg" className="h-14 px-8 rounded-xl bg-white text-primary hover:bg-gray-50 shadow-lg border border-primary/10">
              <Stethoscope className="w-5 h-5 mr-2" />
              Access Vet Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function CheckIcon() {
  return <CheckCircle2 className="w-5 h-5 text-primary" />;
}

import { CheckCircle2 } from "lucide-react";

function FeatureCard({ icon: Icon, step, title, desc }: { icon: any, step: string, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-9xl font-display font-black text-black/[0.02] group-hover:text-primary/[0.03] transition-colors pointer-events-none">
        {step}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
