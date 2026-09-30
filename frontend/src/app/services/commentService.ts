import { Comment, CreateCommentInput, CreateCommentResult } from '../types/models';

// Must be referenced as `process.env.NEXT_PUBLIC_...` literally so Next inlines it at build time.
const API_BASE_URL = process.env.NEXT_PUBLIC_COMMENTS_API_URL?.replace(/\/$/, '');

function apiUrl(path: string): string {
     if (!API_BASE_URL)
          throw new Error('NEXT_PUBLIC_COMMENTS_API_URL is not set.');

     return `${API_BASE_URL}${path}`;
}

const commentService = {
     getAllComments: async function(slug: string): Promise<Comment[]> {
          const response = await fetch(apiUrl(`/comment/${encodeURIComponent(slug)}`), {
               method: 'GET'
          });

          if (!response.ok)
               throw new Error(`The API did not reply with a 2xx status. Response: ${response.status}.`);

          return response.json();
     },

     createComment: async function(slug: string, input: CreateCommentInput): Promise<CreateCommentResult> {
          const response = await fetch(apiUrl(`/comment/${encodeURIComponent(slug)}`), {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(input),
          });

          if (response.ok)
               return { ok: true };

          if (response.status === 400) {
               const { errors }: { errors?: string[] } = await response.json().catch(() => ({}));
               return { ok: false, errors: errors?.length ? errors : ['Please check your comment and try again.'] };
          }

          if (response.status === 429)
               return { ok: false, errors: ["You're commenting too quickly. Please wait a minute and try again."] };

          return { ok: false, errors: ['Something went wrong. Please try again later.'] };
     }
}

export default commentService;
