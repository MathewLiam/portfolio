import { Comment, CommentStatus, CreateCommentInput, ModerationMessage, PublicComment } from "../types/models";
import { CREATE_COMMENT_SQL, GET_COMMENT_SQL, LIST_APPROVED_COMMENTS_SQL, MODERATE_PENDING_COMMENT_SQL, UPDATE_COMMENT_STATUS_SQL } from "../constants/sql";


const commentService = {

     createComment: async function(env: CloudflareBindings, slug: string, input: CreateCommentInput): Promise<string> {
          const id = crypto.randomUUID();

          await env.DB.prepare(CREATE_COMMENT_SQL)
               .bind(id, slug, input.author, input.title, input.body)
               .run();
          await env.QUEUE.send({ commentId: id } satisfies ModerationMessage);

          return id;
     },

     listApproved: async function(env: CloudflareBindings, slug: string): Promise<PublicComment[]> {
          const { results } = await env.DB.prepare(LIST_APPROVED_COMMENTS_SQL)
               .bind(slug)
               .all<PublicComment>();

          return results;
     },

     getComment: async function(env: CloudflareBindings, id: string): Promise<Comment | null> {
          return env.DB.prepare(GET_COMMENT_SQL)
               .bind(id)
               .first<Comment>();
     },

     // Admin decision: always wins, whatever the current status.
     setStatus: async function(env: CloudflareBindings, id: string, status: CommentStatus): Promise<Comment | null> {
          return env.DB.prepare(UPDATE_COMMENT_STATUS_SQL)
               .bind(status, id)
               .first<Comment>();
     },

     // Automated decision: only applies while the comment is still pending.
     moderatePending: async function(env: CloudflareBindings, id: string, status: CommentStatus): Promise<boolean> {
          const { meta } = await env.DB.prepare(MODERATE_PENDING_COMMENT_SQL)
               .bind(status, id)
               .run();

          return meta.changes > 0;
     }

}

export default commentService;
