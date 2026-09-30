import commentService from "./services/commentService";
import moderationService from "./services/moderationService";
import { ModerationMessage } from "./types/models";

// Spam is rejected automatically; everything else stays 'pending' for an admin to approve.
export async function handleModeration(batch: MessageBatch<ModerationMessage>, env: CloudflareBindings): Promise<void> {
     for (const msg of batch.messages) {
          const commentId = msg.body?.commentId;

          // Retrying can't fix a malformed message, but exhausting max_retries parks it in the DLQ for inspection.
          if (typeof commentId !== "string") {
               console.error("malformed moderation message", msg.id, msg.body);
               msg.retry();
               continue;
          }

          try {
               const comment = await commentService.getComment(env, commentId);

               // Deleted, or an admin already decided: nothing to do.
               if (!comment || comment.status !== "pending") {
                    msg.ack();
                    continue;
               }

               const verdict = moderationService.check(comment.title, comment.body);

               if (verdict.spam) {
                    await commentService.moderatePending(env, commentId, "rejected");
                    console.log(`comment ${commentId} rejected: ${verdict.reason}`);
               } else {
                    console.log(`comment ${commentId} awaiting review. APPROVE: PUT /admin/comment/${commentId}/approve, REJECT: PUT /admin/comment/${commentId}/reject`);
               }

               msg.ack();
          } catch (err) {
               // Transient failure (e.g. D1): back off and retry just this message.
               console.error(`moderation failed for ${commentId}`, err);
               msg.retry({ delaySeconds: Math.min(5 * 2 ** msg.attempts, 300) });
          }
     }
}
