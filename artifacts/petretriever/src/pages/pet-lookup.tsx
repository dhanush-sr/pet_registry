import { useState } from "react";
import { pets, Pet } from "@/data/pets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Search,
  PawPrint,
  ShieldCheck,
  ShieldX,
  Syringe,
  Calendar,
  Dog,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function PetLookupPage() {
  const [inputValue, setInputValue] = useState("");
  const [foundPet, setFoundPet] = useState<Pet | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  const [justVerified, setJustVerified] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    setJustVerified(false);
    if (!trimmed) {
      setError("Please enter a Pet ID");
      setFoundPet(null);
      setHasSearched(false);
      return;
    }

    const pet = pets.find((p) => p.id === trimmed);
    setHasSearched(true);

    if (pet) {
      setFoundPet(pet);
      setError("");
    } else {
      setFoundPet(null);
      setError(`No pet found with ID "${trimmed}"`);
    }
  };

  const handleVerify = () => {
    if (foundPet) {
      setVerifiedIds((prev) => new Set(prev).add(foundPet.id));
      setJustVerified(true);
    }
  };

  const isVerified = foundPet ? verifiedIds.has(foundPet.id) : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-14">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
          <Sparkles className="w-4 h-4" />
          Pet Registry Lookup
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-foreground mb-4">
          Find Your{" "}
          <span className="text-gradient">Furry Friend</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Enter a Pet ID to view their full profile, vaccination history, and
          verification status.
        </p>
      </div>

      {/* Search Card */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl mb-10 max-w-2xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="pet-id-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Pet ID (e.g. DOG001)"
              className="pl-12 h-14 text-lg rounded-xl bg-white border-2 focus-visible:ring-0 focus-visible:border-primary uppercase font-mono tracking-wider"
            />
          </div>
          <Button
            id="search-button"
            type="submit"
            size="lg"
            className="h-14 px-8 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Error State */}
      {hasSearched && error && (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div>
              <p className="font-bold text-lg">Pet Not Found</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pet Profile */}
      {foundPet && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Profile Header */}
          <div className="glass-card rounded-3xl p-6 sm:p-10 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
            {/* Decorative blob */}
            <div
              className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                isVerified ? "bg-green-500" : "bg-primary"
              }`}
            />
            <div
              className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none ${
                isVerified ? "bg-emerald-400" : "bg-blue-400"
              }`}
            />

            {/* Image */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl border-4 border-white shadow-2xl overflow-hidden shrink-0 bg-muted relative z-10 group">
              <img
                src={foundPet.image}
                alt={foundPet.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left relative z-10 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-2">
                    {foundPet.name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    <Dog className="w-5 h-5 inline mr-1.5 -mt-0.5" />
                    {foundPet.breed}
                  </p>
                </div>

                {/* Verification Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-500 ${
                    isVerified
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 shadow-emerald-100 shadow-lg"
                      : "bg-amber-50 text-amber-700 border-2 border-amber-200"
                  }`}
                >
                  {isVerified ? (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verified
                    </>
                  ) : (
                    <>
                      <ShieldX className="w-5 h-5" />
                      Not Verified
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pet ID</p>
                  <p className="font-mono font-bold text-lg bg-muted/50 px-3 py-1 rounded-lg inline-block">
                    {foundPet.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Age</p>
                  <p className="font-semibold text-lg">
                    {foundPet.age} {foundPet.age === 1 ? "Year" : "Years"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Last Checkup
                  </p>
                  <p className="font-semibold text-base flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatDate(foundPet.lastCheckupDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left — Actions */}
            <div className="space-y-6">
              {/* Verify Button */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Verification
                </h3>
                {isVerified ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-800">
                        Identity Verified
                      </p>
                      <p className="text-sm text-emerald-600">
                        This pet's profile has been confirmed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    id="verify-button"
                    onClick={handleVerify}
                    className="w-full h-12 rounded-xl text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Verify Pet
                  </Button>
                )}
              </div>

              {/* Quick Info */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <PawPrint className="w-5 h-5 text-primary" />
                  Quick Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-muted-foreground text-sm">
                      Breed
                    </span>
                    <span className="font-medium">{foundPet.breed}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-muted-foreground text-sm">Age</span>
                    <span className="font-medium">
                      {foundPet.age} {foundPet.age === 1 ? "Year" : "Years"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground text-sm">
                      Status
                    </span>
                    <Badge
                      variant={isVerified ? "default" : "secondary"}
                      className={
                        isVerified
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : ""
                      }
                    >
                      {isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Vaccinations */}
            <div className="md:col-span-2">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                  <Syringe className="w-6 h-6 text-primary" />
                  Vaccination Records
                </h3>
                {foundPet.vaccinations.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">
                    No vaccination records found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {foundPet.vaccinations.map((vax, index) => (
                      <div
                        key={vax}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-slate-50/50 hover:bg-slate-100/80 transition-colors group"
                        style={{
                          animationDelay: `${index * 80}ms`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Syringe className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{vax}</p>
                            <p className="text-xs text-muted-foreground">
                              Administered
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Just Verified Toast */}
          {justVerified && (
            <div className="fixed bottom-6 right-6 animate-in slide-in-from-bottom-6 fade-in duration-500 z-50">
              <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <p className="font-bold">Verification Successful!</p>
                  <p className="text-sm text-emerald-100">
                    {foundPet.name} is now verified.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && !foundPet && (
        <div className="text-center py-16 animate-in fade-in duration-700">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary/5 rounded-full flex items-center justify-center">
            <PawPrint className="w-12 h-12 text-primary/30" />
          </div>
          <p className="text-muted-foreground text-lg">
            Enter a Pet ID above to get started
          </p>
          <p className="text-muted-foreground/60 text-sm mt-2">
            Try <span className="font-mono font-bold text-foreground/60">DOG001</span> through{" "}
            <span className="font-mono font-bold text-foreground/60">DOG010</span>
          </p>
        </div>
      )}
    </div>
  );
}
