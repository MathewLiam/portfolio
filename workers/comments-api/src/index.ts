import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { timingSafeEqual } from "hono/utils/buffer";
import commentService from "./services/commentService";
import { createCommentValidator } from "./validators/commentValidator";
import { handleModeration } from "./queue";
import { CommentStatus, ModerationMessage } from "./types/models";

type AppEnv = { Bindings: CloudflareBindings };

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  if (err instanceof HTTPException)
    return err.getResponse();

  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Public: called from the blog in the browser.
app.use("/comment/*", (c, next) => cors({
  origin: c.env.ALLOWED_ORIGIN,
  allowMethods: ["GET", "POST"],
  allowHeaders: ["Content-Type"],
})(c, next));

app.get("/comment/:slug", async (c) => {
  const comments = await commentService.listApproved(c.env, c.req.param("slug"));
  return c.json(comments);
});

app.post("/comment/:slug", async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await c.env.RATE_LIMITER.limit({ key: ip });

  if (!success)
    return c.json({ error: "Too many requests" }, 429);

  await next();
}, createCommentValidator, async (c) => {
  const id = await commentService.createComment(c.env, c.req.param("slug"), c.req.valid("json"));
  return c.json({ id }, 202);
});

// Admin: everything under /admin requires `Authorization: Bearer <ADMIN_TOKEN>`.
const admin = new Hono<AppEnv>();

admin.use("*", bearerAuth({
  verifyToken: async (token, c) => {
    const { ADMIN_TOKEN } = c.env as CloudflareBindings;

    // Fail closed if the secret was never set, rather than comparing against undefined.
    if (!ADMIN_TOKEN) {
      console.error("ADMIN_TOKEN is not configured");
      return false;
    }

    return timingSafeEqual(token, ADMIN_TOKEN);
  },
}));

const STATUS_BY_ACTION: Record<string, CommentStatus> = {
  approve: "approved",
  reject: "rejected",
};

admin.put("/comment/:id/:action{approve|reject}", async (c) => {
  const status = STATUS_BY_ACTION[c.req.param("action")];
  const comment = await commentService.setStatus(c.env, c.req.param("id"), status);

  if (!comment)
    return c.json({ error: "Comment not found" }, 404);

  return c.json(comment);
});

app.route("/admin", admin);

export default {
  fetch: app.fetch,
  queue: handleModeration,
} satisfies ExportedHandler<CloudflareBindings, ModerationMessage>;
