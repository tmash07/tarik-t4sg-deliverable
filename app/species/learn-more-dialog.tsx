"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTrigger } from "@/components/ui/dialog";
import type { Database } from "@/lib/schema";
import { useState } from "react";
type Species = Database["public"]["Tables"]["species"]["Row"];

export default function LearnMoreDialog({ species }: { species: Species }) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogOverlay className="fixed inset-0 z-[9998] bg-black/50" />
      <DialogContent className="z-[9999] sm:max-w-lg">
        <div className="p-2">
          <p className="text-sm text-muted-foreground">
            Scientific Name: {species.scientific_name} <br />
            Common Name: {species.common_name} <br />
            Total Population: {species.total_population} <br />
            Kingdom: {species.kingdom} <br />
            {species.description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
