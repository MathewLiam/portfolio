
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export type Comment = {
     id: string,
     postSlug: string,
     author: string,
     title: string,
     body: string,
     status: CommentStatus,
     createdAt: string, // ISO 8601; D1 has no date type
}

export type PublicComment = Pick<Comment, 'id' | 'author' | 'title' | 'body' | 'createdAt'>;

export type CreateCommentInput = Pick<Comment, 'author' | 'title' | 'body'>;

export type ModerationMessage = {
     commentId: string,
}
