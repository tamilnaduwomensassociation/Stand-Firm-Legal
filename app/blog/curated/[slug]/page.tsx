/**
 * A CURATED LEGAL-UPDATE POST, READ IN FULL.
 *
 * The three evergreen cards in the homepage Blog section (Property
 * Law, Business Law, Documentation) are hand-written in
 * config/site.config.ts, not the database — unlike the live weekly
 * posts, which already had a page for their own "Read" button to open
 * to at /blog/[id]. These three never did, so the button did nothing.
 *
 * This route is that page for the curated set. It looks the entry up
 * by its slug and renders the same summary shown on the card — that
 * is the only copy that exists for these three, so nothing here is
 * invented beyond what already appears in the section itself.
 *
 * A slug that doesn't match any curated post 404s, the same rule the
 * live-post route already follows for an id that isn't published.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { blogPosts } from "@/config/site.config";
import Navbar from "@/components/layout/Navbar";

const Footer = dynamic(() => import("@/components/layout/Footer"));

function findPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function CuratedBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian-deep pt-28 md:pt-32">
        <article className="mx-auto max-w-2xl px-6 pb-24">
          <Link
            href="/#blog"
            className="mb-8 flex w-fit items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-gold transition-colors hover:text-gold-bright"
          >
            <ArrowLeft size={14} /> Back
          </Link>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt=""
            className="mb-8 h-64 w-full rounded-2xl object-cover md:h-80"
          />

          <span className="inline-block rounded-full bg-gold-faint px-3 py-1 text-[10px] uppercase tracking-luxe text-gold">
            {post.tag}
          </span>
          <time className="mt-3 block font-sans text-xs text-ivory-faint">{post.date}</time>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ivory md:text-4xl">
            {post.title}
          </h1>

          <div className="prose-justify mt-8 space-y-5 font-sans text-[15px] leading-[1.9] text-ivory/90">
            <p>{post.excerpt}</p>
          </div>

          <p className="mt-10 rounded-2xl border border-gold/30 bg-gold-faint px-5 py-4 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
            General information, not legal advice. For your specific situation, please consult the
            association directly.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
