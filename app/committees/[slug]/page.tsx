// app/committees/[slug]/page.tsx

import ContentImage from "@/components/ContentImage";
import RichText from "@/components/RichText";
import { getPublishedCommittee, getPublishedCommittees } from "@/lib/content";
import { notFound } from "next/navigation";
import { COPY, formatConferenceText } from "@/lib/conference";
import { getSiteSettings } from "@/lib/siteSettings";
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const committees = await getPublishedCommittees();
  return committees.map((committee) => ({
    slug: committee.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const committee = await getPublishedCommittee(slug);
  
  if (!committee) return {};
  
  return {
    title: committee.name,
    description: formatConferenceText(COPY.metadata.committeeDetailDescription, {
      committeeName: committee.name,
    }),
    openGraph: {
      title: committee.name,
      images: [committee.imageUrl],
    },
  };
}

const CommitteePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const settings = await getSiteSettings();
  if (!settings.pages.committeesEnabled) notFound();
  const committee = await getPublishedCommittee(slug);

  if (!committee) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
         <div className="w-full md:w-1/3">
             <ContentImage
                src={committee.imageUrl}
                alt={committee.name}
                width={600}
                height={800}
                className="w-full h-auto rounded-3xl border-2 border-[var(--color-accent)] shadow-2xl"
             />
         </div>

         <div className="w-full md:w-2/3">
            <h1 className="text-5xl font-bold text-[var(--color-accent)] mb-8">{committee.name}</h1>
            
            <div className="bg-black/30 p-8 rounded-3xl backdrop-blur-sm border border-white/10 mb-8">
                <RichText value={committee.description} />
            </div>

            {Array.isArray(committee.documents) && committee.documents.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-4">{COPY.pages.documentsTitle}</h3>
                    <div className="grid gap-4">
                        {committee.documents.map((doc, i) => {
                          if (
                            !doc ||
                            typeof doc !== "object" ||
                            !("url" in doc)
                          ) {
                            return null;
                          }

                          const title = "title" in doc ? String(doc.title) : "";
                          const url = String(doc.url);

                          return (
                            <a 
                                key={i} 
                                href={`${url}?dl=`} 
                                className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group cursor-pointer border border-transparent hover:border-[var(--color-accent)]"
                            >
                                <span className="text-white font-medium">{title || `Document ${i+1}`}</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)] group-hover:text-white transition-colors">
                                    <path d="M12 15V3M12 15L7 10M12 15L17 10M2 21H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </a>
                          );
                        })}
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default CommitteePage;
