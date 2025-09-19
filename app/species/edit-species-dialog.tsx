"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
type Species = Database["public"]["Tables"]["species"]["Row"];

// We use zod (z) to define a schema for the "Add species" form.
// zod handles validation of the input values with methods like .string(), .nullable(). It also processes the form inputs with .transform() before the inputs are sent to the database.

// Define kingdom enum for use in Zod schema and displaying dropdown options in the form
const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

// Use Zod to define the shape + requirements of a Species entry; used in form validation
const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

type FormData = z.infer<typeof speciesSchema>;

// Default values for the form fields.
/* Because the react-hook-form (RHF) used here is a controlled form (not an uncontrolled form),
fields that are nullable/not required should explicitly be set to `null` by default.
Otherwise, they will be `undefined` by default, which will raise warnings because `undefined` conflicts with controlled components.
All form fields should be set to non-undefined default values.
Read more here: https://legacy.react-hook-form.com/api/useform/
*/
const defaultValues: Partial<FormData> = {
  scientific_name: "",
  common_name: null,
  kingdom: "Animalia",
  total_population: null,
  image: null,
  description: null,
};

export default function EditSpeciesDialog({ userId, species }: { userId: string; species: Species }) {
  const router = useRouter();

  // Control open/closed state of the dialog
  const [open, setOpen] = useState<boolean>(false);

  // Prefill with the existing row values
  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues: {
      scientific_name: species.scientific_name ?? "",
      common_name: species.common_name ?? null,
      kingdom: kingdoms.parse(species.kingdom),
      total_population: species.total_population ?? null,
      image: species.image ?? null,
      description: species.description ?? null,
    },
    mode: "onChange",
  });

  // If the dialog opens later (or species prop changes), ensure fields reflect the latest row
  useEffect(() => {
    if (open) {
      form.reset({
        scientific_name: species.scientific_name ?? "",
        common_name: species.common_name ?? null,
        kingdom: kingdoms.parse(species.kingdom),
        total_population: species.total_population ?? null,
        image: species.image ?? null,
        description: species.description ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, species]);

  const onSubmit = async (input: FormData) => {
    // Check that only the author of the species is editing the entry
    if (species.author && species.author !== userId) {
      return toast({
        title: "Something went wrong",
        description: "You can only edit species you created.",
        variant: "destructive",
      });
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("species")
      .update({
        common_name: input.common_name,
        description: input.description,
        kingdom: input.kingdom,
        scientific_name: input.scientific_name,
        total_population: input.total_population,
        image: input.image,
      })
      .eq("id", species.id);

    // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit

    // Reset form values to the default (empty) values.
    // Practically, this line can be removed because router.refresh() also resets the form. However, we left it as a reminder that you should generally consider form "cleanup" after an add/edit operation.
    form.reset(defaultValues);

    setOpen(false);

    // Refresh all server components in the current route. This helps display the newly created species because species are fetched in a server component, species/page.tsx.
    // Refreshing that server component will display the new species from Supabase
    router.refresh();

    return toast({
      title: "Species edited!",
      description: "Successfully edited " + input.scientific_name + ".",
    });
  };

  return (
    <div>
      {" "}
      {species.id > 16 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Icons.add className="mr-3 h-5 w-5" />
              Edit Species
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Species</DialogTitle>
              <DialogDescription>
                Edit an existing species here. Click &quot;Edit Species&quot; below when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
                <div className="grid w-full items-center gap-4">
                  <FormField
                    control={form.control}
                    name="scientific_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scientific Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Cavia porcellus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="common_name"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Common Name</FormLabel>
                          <FormControl>
                            <Input value={value ?? ""} placeholder="Guinea pig" {...rest} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="kingdom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kingdom</FormLabel>
                        <Select onValueChange={(value) => field.onChange(kingdoms.parse(value))} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a kingdom" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {kingdoms.options.map((kingdom, index) => (
                                <SelectItem key={index} value={kingdom}>
                                  {kingdom}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_population"
                    render={({ field }) => {
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Total population</FormLabel>
                          <FormControl>
                            {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                            <Input
                              type="number"
                              value={value ?? ""}
                              placeholder="300000"
                              {...rest}
                              onChange={(event) => field.onChange(+event.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input
                              value={value ?? ""}
                              placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_the_amazing_guinea_pig.jpg/440px-George_the_amazing_guinea_pig.jpg"
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              value={value ?? ""}
                              placeholder="The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <div className="flex">
                    <Button type="submit" className="ml-1 mr-1 flex-auto">
                      Edit Species
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}{" "}
    </div>
  );
}
