import { useState } from "react";
import { useListPets, useAddVaccination, useAddMedicalRecord, useMarkPetVerified, PetStatus } from "@workspace/api-client-react";
import { useVetAuth } from "@/hooks/use-vet-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Search, Plus, CheckCircle2, Syringe, ClipboardList, Loader2, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function VetDashboardPage() {
  const { logout } = useVetAuth();
  const [search, setSearch] = useState("");
  const { data: petsData, isLoading, isError } = useListPets(search ? { search } : undefined);
  const pets = Array.isArray(petsData) ? petsData : [];
  const { vet } = useVetAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {vet && (
        <div className="flex items-center gap-3 mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <Stethoscope className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Signed in as <span className="font-semibold">{vet.name}</span>
            {vet.clinic && <span className="text-muted-foreground"> · {vet.clinic}</span>}
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Veterinarian Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage pet health records and verify identities.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search pets..." 
              className="pl-9 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-destructive">
            Unable to load pets — API server not connected.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pets.map(pet => (
              <div key={pet.id} className="p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50 transition-colors">
                <div className="flex-1 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {pet.photoUrl && <img src={pet.photoUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">{pet.species} • {pet.owner?.name}</p>
                    <p className="text-xs font-mono mt-1 text-muted-foreground">ID: {pet.petId}</p>
                  </div>
                </div>
                
                <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                  <StatusBadge status={pet.status} />
                  
                  <div className="w-px h-8 bg-border hidden md:block mx-2" />
                  
                  <AddVaccinationDialog petId={pet.id} petName={pet.name} />
                  <AddMedicalDialog petId={pet.id} petName={pet.name} />
                  
                  {pet.status !== PetStatus.Verified && (
                    <VerifyPetButton petId={pet.id} />
                  )}
                </div>
              </div>
            ))}
            
            {pets.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                No pets found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddVaccinationDialog({ petId, petName }: { petId: string, petName: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [verified, setVerified] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useAddVaccination();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        id: petId,
        data: { type, date: new Date(date).toISOString(), verified, notes }
      });
      toast({ title: "Success", description: "Vaccination record added." });
      queryClient.invalidateQueries({ queryKey: [`/api/pets/${petId}/vaccinations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/pets/${petId}`] });
      setOpen(false);
      setType(""); setNotes("");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add record." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg h-9">
          <Syringe className="w-4 h-4 mr-2" /> Vax
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Vaccination for {petName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Vaccine Type</Label>
            <Input required value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Rabies" />
          </div>
          <div className="space-y-2">
            <Label>Date Administered</Label>
            <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Clinical Notes (Optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Lot number, manufacturer, etc." />
          </div>
          <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg border border-border">
            <Checkbox id="verified" checked={verified} onCheckedChange={(c) => setVerified(!!c)} />
            <label htmlFor="verified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Certify as Veterinarian Verified
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMedicalDialog({ petId, petName }: { petId: string, petName: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useAddMedicalRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({ id: petId, data: { notes } });
      toast({ title: "Success", description: "Medical note added." });
      queryClient.invalidateQueries({ queryKey: [`/api/pets/${petId}/medical`] });
      queryClient.invalidateQueries({ queryKey: [`/api/pets/${petId}`] });
      setOpen(false);
      setNotes("");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add record." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg h-9">
          <ClipboardList className="w-4 h-4 mr-2" /> Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Medical Note for {petName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Observation / Treatment</Label>
            <Textarea required className="min-h-[150px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter detailed medical notes here..." />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Note"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VerifyPetButton({ petId }: { petId: string }) {
  const mutation = useMarkPetVerified();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleVerify = async () => {
    try {
      await mutation.mutateAsync({ id: petId });
      toast({ title: "Pet Verified", description: "Identity and status updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/pets`] });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to verify pet." });
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleVerify} 
      disabled={mutation.isPending}
      className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9"
    >
      <CheckCircle2 className="w-4 h-4 mr-2" /> Verify
    </Button>
  );
}
