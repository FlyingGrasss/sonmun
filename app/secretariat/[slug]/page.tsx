// app/secretariat/[slug]/page.tsx

import ContentImage from "@/components/ContentImage";
import RichText from "@/components/RichText";
import { getPublishedSecretariat, getPublishedSecretariatMember } from "@/lib/content";
import { CONFERENCE, COPY, formatConferenceText } from "@/lib/conference";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const members = await getPublishedSecretariat();
  return members.map((member) => ({
    slug: member.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const member = await getPublishedSecretariatMember(slug);
  
  if (!member) return {};
  
  return {
    title: `${member.name} - Secretariat`,
    description: formatConferenceText(COPY.metadata.secretariatDetailDescription, {
      memberName: member.name,
      role: member.role,
      shortName: CONFERENCE.shortName,
    }),
    openGraph: {
      title: member.name,
      images: [member.imageUrl],
    },
  };
}

const SecretariatPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const member = await getPublishedSecretariatMember(slug);

  if (!member) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-start">
         <div className="w-full md:w-1/3 sticky top-24">
             <ContentImage
                src={member.imageUrl}
                alt={member.name}
                width={600}
                height={800}
                className="w-full h-auto rounded-3xl border-2 border-[var(--color-accent)] shadow-2xl mb-6"
             />
             {member.instagram && (
                 <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity shadow-lg">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                     </svg>
                     Follow
                 </a>
             )}
         </div>

         <div className="w-full md:w-2/3">
            <h1 className="text-6xl max-sm:text-3xl font-bold text-white mb-2">{member.name}</h1>
            <h2 className="text-3xl max-sm:text-xl text-[var(--color-accent)] mb-8 font-semibold">{member.role}</h2>
            
            <div className="prose max-w-none">
                <RichText value={member.bio} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default SecretariatPage;
