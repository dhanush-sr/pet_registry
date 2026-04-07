import { useState } from "react";
import { Link } from "wouter";
import { useVerifyPet } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { Phone, PawPrint, Loader2, ChevronRight, Dog, Calendar, Hash } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function MyPetsPage() {
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);

  const { data: pets, isLoading, isError } = useVerifyPet(
    { phone: submittedPhone ?? "" },
    { query: { enabled: !!submittedPhone } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) setSubmittedPhone(phone.trim());
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
          <PawPrint className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">My Pets</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Enter the phone number you registered with to view all your pets and their records.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="phone" className="sr-only">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your registered phone number"
                className="pl-9"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="shrink-0">
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
              : "Find My Pets"
            }
          </Button>
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {isError && submittedPhone && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Dog className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No pets found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            No pets are registered under <strong>{submittedPhone}</strong>. Try a different number or{" "}
            <Link href="/register" className="text-primary hover:underline">register a pet</Link>.
          </p>
        </div>
      )}

      {pets && pets.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            Found {pets.length} pet{pets.length !== 1 ? "s" : ""} registered to {submittedPhone}
          </p>
          {pets.map(pet => (
            <Link key={pet.id} href={`/pet/${pet.id}`}>
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 flex gap-4 items-center hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dog className="w-7 h-7 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground">{pet.name}</h3>
                    <StatusBadge status={pet.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pet.species} · {pet.breed} · {pet.age} yr{pet.age !== 1 ? "s" : ""} · {pet.gender}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {pet.petId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Registered {formatDate(pet.createdAt.toString())}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!submittedPhone && (
        <div className="text-center py-12 text-muted-foreground">
          <PawPrint className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter your phone number above to find your registered pets</p>
        </div>
      )}
    </div>
  );
}
