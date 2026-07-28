// types.ts

export type CommitteeType = {
    id: number;
    sortOrder: number;
    name: string;
    slug: string;
    imageUrl: string;
    description: string;
    documents?: {
        url: string;
        title: string;
    }[];
    isPublished: boolean;
};

export type SecretariatType = {
    id: number;
    sortOrder: number;
    name: string;
    role: string;
    slug: string;
    imageUrl: string;
    bio: string;
    instagram?: string;
    isPublished: boolean;
};
