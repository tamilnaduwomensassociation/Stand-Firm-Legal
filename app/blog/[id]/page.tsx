/**
 * A PUBLISHED POST, READ IN FULL.
 *
 * This is the page the Blog panel's "Publish" button was missing. The
 * panel could always draft and approve a post; nothing on the public
 * site could ever be reached to actually read one. This route plus
 * the fetch in components/sections/Blog.tsx close that gap.
 *
 * A draft, or a post that does not exist, 404s — this route never
 * reveals unpublished content, matching the same "published posts are
 * public; drafts are not" rule the API already enforces.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { get } from "@/lib/server/db";
import Navbar from "@/components/layout/Navbar";

const Footer = dynamic(() => import("@/components/layout/Footer"));

export const runtime = "nodejs";

type Post = {
  id: string;
  title: string;
  summary?: string;
  body: string;
  image?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
};

async function getPublishedPost(id: string): Promise<Post | null> {
  try {
    const row = await get("posts", id);
    if (!row || row.status !== "published") return null;
    return row as unknown as Post;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublishedPost(id);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.summary || post.title,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublishedPost(id);
  if (!post) notFound();

  const date = post.publishedAt || post.createdAt;

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

          {post.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.image}
              alt=""
              className="mb-8 h-64 w-full rounded-2xl object-cover md:h-80"
            />
          ) : null}

          <time className="block font-sans text-xs text-ivory-faint">
            {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ivory md:text-4xl">
            {post.title}
          </h1>
          {post.summary && (
            <p className="mt-4 font-sans text-base leading-relaxed text-ivory-dim">
              {post.summary}
            </p>
          )}

          <div className="prose-justify mt-8 space-y-5 font-sans text-[15px] leading-[1.9] text-ivory/90">
            {post.body.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
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
