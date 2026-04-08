import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePet, useUploadPhoto, CreatePetRequestGender } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, ArrowRight, CheckCircle2 } from "lucide-react";

const registerSchema = z.object({
  ownerName: z.string().min(2, "Name is required"),
  ownerPhone: z.string().min(10, "Valid phone required"),
  ownerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  name: z.string().min(1, "Pet name required"),
  species: z.string().min(1, "Species required"),
  breed: z.string().min(1, "Breed required"),
  age: z.coerce.number().min(0, "Age must be 0 or greater"),
  gender: z.enum(["Male", "Female", "Unknown"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createPetMutation = useCreatePet();
  const uploadPhotoMutation = useUploadPhoto();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: "Unknown",
    }
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      let uploadedUrl = null;
      
      // Upload photo first if exists
      if (photoFile && previewUrl) {
        const uploadRes = await uploadPhotoMutation.mutateAsync({
          data: { filename: photoFile.name, dataUrl: previewUrl }
        });
        uploadedUrl = uploadRes.url;
      }

      // Create pet
      const autoRhinariumId = `RH-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const pet = await createPetMutation.mutateAsync({
        data: {
          ...data,
          gender: data.gender as CreatePetRequestGender,
          rhinariumId: autoRhinariumId,
          photoUrl: uploadedUrl,
        }
      });

      toast({
        title: "Registration Successful!",
        description: `Pet ${pet.name} has been registered. ID: ${pet.petId}`,
      });

      setLocation(`/pet/${pet.id}`);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "An error occurred during registration.",
      });
    }
  };

  const nextStep = async () => {
    let valid = false;
    if (step === 1) {
      valid = await form.trigger(["ownerName", "ownerPhone", "ownerEmail"]);
    } else if (step === 2) {
      valid = await form.trigger(["name", "species", "breed", "age", "gender"]);
    }
    
    if (valid) {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold">Register a New Pet</h1>
        <p className="text-muted-foreground mt-2">Create a secure digital identity for your pet</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" 
          style={{ width: `${((step - 1) / 2) * 100}%` }} 
        />
        
        {[1, 2, 3].map((num) => (
          <div 
            key={num} 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-4 border-background",
              step >= num ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-3xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 1: Owner Info */}
          <div className={cn("space-y-6", step !== 1 && "hidden")}>
            <div>
              <h2 className="text-xl font-bold mb-1">Owner Details</h2>
              <p className="text-sm text-muted-foreground">Who should be contacted if the pet is found?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input {...form.register("ownerName")} placeholder="John Doe" className="mt-1" />
                {form.formState.errors.ownerName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.ownerName.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input {...form.register("ownerPhone")} placeholder="(555) 123-4567" className="mt-1" />
                  {form.formState.errors.ownerPhone && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.ownerPhone.message}</p>
                  )}
                </div>
                <div>
                  <Label>Email (Optional)</Label>
                  <Input type="email" {...form.register("ownerEmail")} placeholder="john@example.com" className="mt-1" />
                  {form.formState.errors.ownerEmail && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.ownerEmail.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="button" onClick={nextStep} className="rounded-xl px-8">
                Continue to Pet Details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* STEP 2: Pet Info */}
          <div className={cn("space-y-6", step !== 2 && "hidden")}>
            <div>
              <h2 className="text-xl font-bold mb-1">Pet Information</h2>
              <p className="text-sm text-muted-foreground">Tell us about your furry friend.</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Pet Name</Label>
                  <Input {...form.register("name")} placeholder="Bella" className="mt-1" />
                  {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label>Species</Label>
                  <Input {...form.register("species")} placeholder="Dog, Bird, etc." className="mt-1" />
                  {form.formState.errors.species && <p className="text-sm text-destructive mt-1">{form.formState.errors.species.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Breed</Label>
                  <Input {...form.register("breed")} placeholder="Golden Retriever" className="mt-1" />
                  {form.formState.errors.breed && <p className="text-sm text-destructive mt-1">{form.formState.errors.breed.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age (Years)</Label>
                    <Input type="number" {...form.register("age")} placeholder="3" className="mt-1" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select onValueChange={(v) => form.setValue("gender", v as any)} defaultValue={form.getValues("gender")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl px-6">
                Back
              </Button>
              <Button type="button" onClick={nextStep} className="rounded-xl px-8">
                Continue to Photo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* STEP 3: Photo */}
          <div className={cn("space-y-6", step !== 3 && "hidden")}>
            <div>
              <h2 className="text-xl font-bold mb-1">Add a Photo</h2>
              <p className="text-sm text-muted-foreground">A clear photo helps identify your pet quickly.</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-muted/50 transition-colors">
              <Input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload" 
                onChange={handlePhotoSelect}
              />
              <Label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                )}
                <span className="font-semibold text-primary">Click to upload photo</span>
                <span className="text-sm text-muted-foreground mt-1">JPG, PNG up to 5MB</span>
              </Label>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-xl px-6">
                Back
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl px-8" 
                disabled={createPetMutation.isPending || uploadPhotoMutation.isPending}
              >
                {(createPetMutation.isPending || uploadPhotoMutation.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Complete Registration</>
                )}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
