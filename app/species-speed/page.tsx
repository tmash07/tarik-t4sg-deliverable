/* eslint-disable */
import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const AnimalSpeedGraph = dynamic(() => import("./animal-speed-graph"), { ssr: false });

export default async function SpeciesSpeedPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Species Speed</TypographyH2>
      </div>
      <Separator className="my-4" />
      <section className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">How Fast Are Animals?</h1>
        <p className="text-white-700">
          The animal kingdom is full of speedsters, from the lightning-fast cheetah to the surprisingly swift pronghorn
          antelope. But not all animals are built for speed—herbivores, omnivores, and carnivores have evolved different
          strategies for survival, and their top velocities reflect their lifestyles. Carnivores often rely on bursts of
          speed to catch prey, while herbivores may need to outrun predators, and omnivores fall somewhere in between.
          The graph below compares the velocities of various animals, grouped by their dietary category, to reveal
          fascinating patterns in nature’s race for survival.
        </p>
      </section>
      <AnimalSpeedGraph />
    </>
  );
}
