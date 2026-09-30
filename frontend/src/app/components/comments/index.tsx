"use client"

import { useState, useEffect } from "react"
import { Comment } from '../../types/models';
import commentService from "@/app/services/commentService";
import CreateCommentForm from "../forms/createComment";

type LoadState = "loading" | "loaded" | "error";

// Same format as post dates (see formatDate in src/lib/posts.ts, which can't be imported here: it uses fs).
const formatCommentDate = (isoDate: string): string =>
     new Date(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const Comments = ({
     slug
}: {
     slug: string
}): React.ReactElement => {
     const [comments, setComments] = useState<Comment[]>([]);
     const [loadState, setLoadState] = useState<LoadState>("loading");

     useEffect(() => {
          let cancelled = false;

          commentService.getAllComments(slug)
               .then(comments => {
                    if (cancelled) return;
                    setComments(comments);
                    setLoadState("loaded");
               })
               .catch(error => {
                    if (cancelled) return;
                    console.warn(error);
                    setLoadState("error");
               });

          return () => { cancelled = true; };
     }, [slug]);

     return (
          <section className="mt-16 border-t border-zinc-200 pt-6 dark:border-zinc-800">
               <h2 className="text-2xl font-bold tracking-tight">Comments</h2>
               {loadState === "loading" && <p className="mt-4 text-zinc-500">Loading comments...</p>}
               {loadState === "error" && <p className="mt-4 text-zinc-500">Comments are unavailable right now.</p>}
               {loadState === "loaded" && comments.length === 0 && <p className="mt-4 text-zinc-500">It&apos;s pretty quiet in here...</p>}
               {loadState === "loaded" && comments.length > 0 &&
                    <div className="mt-4 flex flex-col gap-6">
                         {comments.map((comment: Comment) => {
                              return (
                                   <article key={comment.id}>
                                        <div className="flex flex-col md:flex-row justify-between">
                                             <p className="font-bold text-lg">{comment.title}</p>
                                             <time dateTime={comment.createdAt} className="text-sm text-zinc-500">{formatCommentDate(comment.createdAt)}</time>
                                        </div>
                                        <p className="text-sm text-zinc-500">{comment.author}</p>
                                        <p className="mt-2 whitespace-pre-line">
                                             {comment.body}
                                        </p>
                                   </article>
                              )
                         })}
                    </div>
               }
               <CreateCommentForm slug={slug} />
          </section>
     )
}

export default Comments;
