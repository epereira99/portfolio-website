import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { World } from "@/world/World";
import { initialViewFor } from "@/world/view";
import { CONTRACTS, contractBySlug } from "@/content/contracts";

type Props = { params: Promise<{ slug: string }> };

// Every contract is prerendered, so its scroll is in the first HTML response for sharing and search.
export async function generateStaticParams() {
  return CONTRACTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const contract = contractBySlug((await params).slug);
  return contract ? { title: `${contract.title} · Contracts · Eduardo Pereira`, description: contract.subtitle } : {};
}

// With Partial Prefetching on, params are awaited inside Suspense (node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md).
export default function ContractPage({ params }: Props) {
  return (
    <Suspense>
      <Contract params={params} />
    </Suspense>
  );
}

async function Contract({ params }: Props) {
  const { slug } = await params;
  if (!contractBySlug(slug)) notFound();
  return <World initial={initialViewFor(slug)} />;
}
