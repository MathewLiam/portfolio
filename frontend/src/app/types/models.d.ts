
export type Comment = {
     id: string,
     author: string,
     title: string,
     body: string,
     createdAt: string, // ISO 8601 string; JSON has no date type
}

export type CreateCommentInput = Pick<Comment, 'author' | 'title' | 'body'>;

export type CreateCommentResult =
     | { ok: true }
     | { ok: false, errors: string[] };
